// * This module forces an ETL for a given pipeline_id.
/*
    ! BE VERY SURE WHILE EXECUTING THIS SCRIPT.
    ! There won't be any checks regarding ETL status, recommendation and other parameters which ensure that data is crawled
    ! properly and then ETL is performed.
    ! Executing this script may result in data duplicity, data inconsistency etc.
 **/

const { program } = require("commander");
require('dotenv').config({ path: '../.env' });
const { MongoClient, ObjectId } = require("mongodb");
const agentLoad = require("../util/getPrefectAgent");
const childProcess = require("child_process");
const { runEtlNow } = require("../util/runEtlNow");
// const getFlowRunData = require("../util/prefectFlowRunData");
const { getFlowId } = require("../util/getFlowNameId");
const { infoLogger, errorLogger } = require("./logger");
const fs = require("fs");

// const mongo_uri = process.env.MONGODB_URI;
const mongo_uri = process.env.MONGO_PROD_URI;
const prefect_uri = "https://apollo.prefect.1digitalstack.com/";

let client;
const requiredPipelines = new Array();


const checkOptionsValidity = function () {
    let areOptionsValid = false;
    try{
        let initialParameter, initialContext;

        if (fs.existsSync(initialParametersFilePath)) {
            initialParameter = JSON.parse(fs.readFileSync(initialParametersFilePath));
        };

        if (fs.existsSync(initialContextFilePath)) {
            initialContext = JSON.parse(fs.readFileSync(initialContextFilePath));

        };

        if(filePath && !startDate && !endDate && !clientId){
            if(fs.existsSync(filePath)){
                const pipelinesFromFile = fs.readFileSync(filePath, {encoding:"utf-8",flag:"r"});
                pipelinesFromFile.split(/\r?\n/).forEach((pipeline) => pipeline.length && requiredPipelines.push(pipeline));
                console.log(requiredPipelines)
                areOptionsValid = !!requiredPipelines.length;
            }else{
                areOptionsValid = false;
                throw new Error("File does not exist.");
            }
        }else if(startDate && endDate && clientId && !filePath){
            if(startDate.length && endDate.length && clientId.length){
                areOptionsValid = true;
            }else{
                areOptionsValid = false;
                throw new Error("Invalid options detected.\nExiting program");
            }
        }else{
            areOptionsValid = false;
            throw new Error("Invalid options detected.\nExiting program.")
        }
    }catch(err){
        console.log(err.message);
        const error_obj = { name,message,stack } = { err };
        errorLogger.error(error_obj);
    };
    
    return areOptionsValid;
};


const connectMongo = async function (mongo_uri, collectionName) {
    try {
        client = new MongoClient(mongo_uri, { maxPoolSize: 1 });
        await client.connect();
        const db = client.db();
        const collectionData = db.collection(collectionName);
        return collectionData;
    } catch (error) {
        const error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack
        };
        errorLogger.error(error_obj);
    }
}

const getProjectName = async function (parserPipeline, pageType) {
    try {
        const etlConfigs = await connectMongo(mongo_uri, "etlconfigs");
        let requiredEtlconfig = await etlConfigs.findOne({ "etlParserPipeline": parserPipeline, "pageType": pageType });
        console.log(requiredEtlconfig, 'required config');
        if (!requiredEtlconfig) {
            console.log("Please contact ETL administrators to add a valid ETL config");
            process.exit(1);
        };
        let projectName = requiredEtlconfig['etlProjectName'];
        let flowName = requiredEtlconfig['etlFlowName'];

        // get context and parameters from etl-config
        let dbContext, dbParameter;

        if (requiredEtlconfig.context) {
            dbContext = JSON.parse(requiredEtlconfig.context);
        } else {
            dbContext = undefined;
        }

        if (requiredEtlconfig.parameter) {
            dbParameter = JSON.parse(requiredEtlconfig['parameter']);
        } else {
            dbParameter = undefined;
        }

        let defaultContext, defaultParameter;

        if (!dbContext) {
            defaultContext = {
                "schema": requiredEtlconfig.schemaName,
                "table": requiredEtlconfig.tableName,
                "mongodb_type": "production",
                "postgresdb_type": "production"
            }
        };

        if (!dbParameter) {
            defaultParameter = {
                "translate_fields": ['title']
            }
        };

        await client.close();

        let project_config_details = { "projectName": projectName, "flowName": flowName, "dbParameter": dbParameter, "dbContext": dbContext, "defaultParameter": defaultParameter, "defaultContext": defaultContext };

        return project_config_details;

    } catch (error) {
        console.log(error, 'get project name error');
        const error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack
        };
        errorLogger.error(error_obj);
        return;
    }
};

const getPipelines = async function (parserPipeline, startDate, endDate) {
    try {
        /*
            if file is provided or not, check for it.
            if not, then, follow standard procedure.
            if yes, first check the file is there or not.
                if not, then throw an error.
                if yes, read pipelines line by line and trim it for WS etc, and  store in array and return array.

            HELP: describe syntax
                pipeline-id-1
                pipeline-id-2
            either use st-et or use only -f option. Both won't co-exists and it should throw error.

        **/
        const jobStatusesCollection = await connectMongo(mongo_uri, 'jobstatuses');

        startDate = startDate && new Date(startDate).toISOString();
        endDate = endDate && new Date(endDate).toISOString();

        const requiredPipelineId = requiredPipelines.length ? [...requiredPipelines] : new Array();

        if(!requiredPipelineId.length){
            // Get all the records from parser collection where crawl time is greater than or equal to start-date but less than or equal to end-date
            let jobsMatched = jobStatusesCollection.find(
    
                {
                    "parser.pipeline": parserPipeline,
                    "createdAt": { $gte: new Date(startDate), $lte: new Date(endDate) }
                }
    
            );
    
            // save all the pipeline-ids in an array
            while (await jobsMatched.hasNext()) {
                let record = await jobsMatched.next();
                requiredPipelineId.push(record['_id'].toString());
            };
            await client.close();
        }
        return requiredPipelineId;
    } catch (error) {
        console.log(error)
        const error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack
        };
        errorLogger.error(error_obj);
        return;
    }

};

// this fucction hits prefect to execute an ETL
let forceExecuteEtl = async function (flowId, flowRunName, etlParameters, etlContext, prefect_uri,pipeline,projectName) {
    try {

        let flowRunId = await runEtlNow(flowId, flowRunName, etlParameters, etlContext, prefect_uri)

        const message = {
            "pipelineId": pipeline,
            "project": projectName,
            "flowId": flowId,
            "flowRunId": flowRunId
        };
        infoLogger.info(message);
    } catch (error) {
        console.log(error, 'forceExecuteEtl error');
        let error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack,
        };
        errorLogger.error(error_obj);
    }
}

let getPipelineIdDataRecursively = async function (pipelineIdArray, projectName, flowName, date, month, etlParameter, etlContext,prefect_uri, environment) {
    try {
        for (let pipeline of pipelineIdArray) {
            etlParameter['pipeline_id'] = pipeline;

            let flow_id = await getFlowId(flowName, projectName,prefect_uri);
            if (flow_id !== null && !flow_id.isAxiosError) {

                let flowRunName = date + month + '-' + pipeline;

                // check the available flow-run limit
                let availableFlowRunLimit = await agentLoad(prefect_uri);
                console.log(availableFlowRunLimit, 'agent load');

                // Check for script execution environment, if test, don't run ETL for any pipelines
                if(environment && environment === "test") return true;

                if (availableFlowRunLimit > 0) {
                    await forceExecuteEtl(flow_id, flowRunName, etlParameter, etlContext,prefect_uri,pipeline,projectName);
                } else {
                    // wait till availableFlowRunLimit becomes greater than 0
                    while (availableFlowRunLimit <= 0) {
                        // sleep for 1 minutes 35 seconds
                        childProcess.execSync("sleep 95");
                        console.log("\nsleeping for 60 seconds due to high load on prefect agent and retyring after that");
                        availableFlowRunLimit = await agentLoad(prefect_uri);
                        console.log(availableFlowRunLimit, 'agent load');
                    }
                    if (availableFlowRunLimit > 0) {
                        await forceExecuteEtl(flow_id, flowRunName, etlParameter, etlContext,prefect_uri,pipeline,projectName);
                    }
                }

            } else {
                if (flow_id === null) {
                    const message = {
                        "pipelineId": pipeline,
                        "project": projectName,
                        "state": "NOT FOUND"
                    };
                    infoLogger.warn(message);
                } else if (flow_id.isAxiosError) {

                    let modifiedPipelineIdArrayStartIndex = pipelineIdArray.indexOf(pipeline);
                    let modifiedPipelineIdArray = pipelineIdArray.slice(modifiedPipelineIdArrayStartIndex);
                    console.log("THE NEW LENGTH IS ", modifiedPipelineIdArray.length);
                    setTimeout(async () => {
                        if (modifiedPipelineIdArray.length !== 0) {
                            console.log("\nsleeping for 60 seconds due to axios error and retyring after that");
                            await getPipelineIdDataRecursively(modifiedPipelineIdArray, projectName, flowName, date, month, etlParameter, etlContext,prefect_uri)
                        };
                    }, 60000);

                }

            }
        }
    } catch (error) {
        console.log(error, 'get pipeline data recursively error');
        let error_obj = {
            "name": error.name,
            "message": error.name,
            "stack": error.stack
        };
        errorLogger.error(error_obj);
        return;
    }
}



const forceEtl = async function (parserPipeline, clientId, startDate, endDate, pageType, initialParameter, initialContext, environment) {

    let forceEtlDone = false;
    // CLI parameters validation goes here
    const validation = function (parserPipeline, startDate, endDate, clientId) {
        let isValid = true;

        let startDateValue = new Date(startDate).getTime();
        let endDatevalue = new Date(endDate).getTime();

        if (parserPipeline === undefined) {
            isValid = false;
        };
        if(!requiredPipelines.length){
            if (startDateValue.toString() === 'NaN') {
                isValid = false;
            };
            if (endDatevalue.toString() === 'NaN') {
                isValid = false;
            };
            if(clientId === undefined){
                isValid = false;
            }
        }
        return isValid;
    };

    let isValid = validation(parserPipeline, startDate, endDate, clientId);

    if (isValid) {
        try {
            let project_config_details = await getProjectName(parserPipeline, pageType);
            console.log(project_config_details, 'project config details')

            let projectName = project_config_details.projectName;
            let flowName = project_config_details.flowName;
            let dbParameter = project_config_details.dbParameter;
            let dbContext = project_config_details.dbContext;
            let defaultContext = project_config_details.defaultContext;
            let defaultParameter = project_config_details.defaultParameter;

            /*
            ? parameters and context precedence order:
            * initialParamert(or,context) > dbParameter(or,context) > runTimeParameter(or,context)
            * initial parameter is provided through a file via CLI argument 
            * DB parameter is provided via etlConfig collection
            * runTimeParameter/Context(or, default parameter/context) is gathered from etlConfig file using various fields
        **/

            let context, parameter;

            if (!initialContext) {
                if (!dbContext) {
                    context = defaultContext;
                    context['preferred_seller'] = 'unknown';
                } else {
                    context = dbContext;
                }
            } else {
                context = initialContext;
            }

            if (!initialParameter) {
                if (!dbParameter) {
                    parameter = defaultParameter;
                } else {
                    parameter = dbParameter;
                }
            } else {
                parameter = initialParameter;
            }

            let pipelineIdArray = await getPipelines(parserPipeline, startDate, endDate);
            console.log(pipelineIdArray, 'pid array');

            let currentDate = new Date();
            let date = currentDate.getDate();
            let month = currentDate.toLocaleString('default', { month: 'short' });

            await getPipelineIdDataRecursively(pipelineIdArray, projectName, flowName, date, month, parameter, context, prefect_uri, environment);
            forceEtlDone = true;
        } catch (error) {
            console.log(error);
            const error_obj = {
                "name": error.name,
                "message": error.message,
                "stack": error.stack
            };
            errorLogger.error(error_obj);
            forceEtlDone = true;
        }

    } else {
        const error_obj = {
            "name": "validationError",
            "message": "CLI input parameter validation falied"
        };
        errorLogger.error(error_obj);
        forceEtlDone = true;
    }
    return forceEtlDone;
}

program
    .version('2.0.0', '-v, --version')
    .description("Forces all pipelineId of a parser pipeline to undergo ETL process")

program
    .requiredOption('-ppl, --parser-pipeline <parser_pipeline_name>', 'Enter a valid parser pipeline name whose ETL config exists')
    .option('-c, --client-id <client-id>', 'Enter a valid clientId')
    .option('-f, --file-path <absolute_path_to_the_file_containing_pipeline_id','Enter the absolute path of the file containing line-separated pipeline-id')
    .option('-st, --start-date <start_date_in_ISO_format (YYYY-MM-DD HH:mm:ss)>', 'format : YYYY-MM-DD HH:mm:ss')
    .option('-et, --end-date <end_date_in_ISO_format (YYYY-MM-DD HH:mm:ss)>', 'format: YYYY-MM-DD HH:mm:ss')
    .option('-p, --page-type <page type (pantry,fresh,groceries)')
    .option('-ip, --initial-parameters-file-path <absolute file path having JSON object for ETL parameters (optional)>')
    .option('-ic, --initial-context-file-path <absolute file path having JSON object for ETL context (optional)>')
    .option('-mode <the environment to run this script. Default is production, otherwise we can provide "test" to test the script functionality>')
    .parse()
    .description('Starts the ETL process for the given parser pipeline for the pipelineId which have "createdAt" between start date and end date or which are provided in the file passed')

const opts = program.opts();
const {
    parserPipeline,
    filePath,
    clientId,
    startDate,
    endDate,
    pageType,
    initialParametersFilePath,
    initialContextFilePath,
} = opts;

// Execution environment
const environment = opts.Mode;

async function startForceEtl(parserPipeline, clientId, startDate, endDate, pageType, initialParameter, initialContext, environment) {
    console.log(parserPipeline, clientId, startDate, endDate, pageType, initialParameter, initialContext, 'getting cli opts')
    let forceEtlDone = await forceEtl(parserPipeline, clientId, startDate, endDate, pageType, initialParameter, initialContext, environment);
    if (forceEtlDone) {
        setTimeout(() => {
            process.exit();
        }, 1000);
    }
};

if(checkOptionsValidity()){
    console.log("options are valid");
    startForceEtl(parserPipeline, startDate, endDate, clientId, pageType, initialParametersFilePath, initialContextFilePath, environment);
}else{
    process.exit(1);
}