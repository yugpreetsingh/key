/*
This module atomatically executes ETL for those pipeline_ids for whom the recommendation is "Go ahead".
This is done in 5 stages
*/

const { MongoClient, ObjectId } = require("mongodb");
const { program } = require("commander");
const fs = require("fs");

require('dotenv').config({ path: __dirname + "/../.env" });

const agentLoad = require("../util/getPrefectAgent");
const getFlowRunData = require("../util/prefectFlowRunData");
const { infoLogger, errorLogger } = require('./logger');
const { getFlowId } = require("../util/getFlowNameId");
const childProcess = require("child_process");
const { runEtlNow } = require("../util/runEtlNow");
const { blacklistPipeline, checkPipelineInBlacklist } = require("../util/blacklistPipeline");
const { ObjectID } = require("bson");

const mongo_uri = process.env.MONGODB_URI;

// ASCII terminal color and font-styles
const FG_YELLOW = "\x1b[33m";
const FG_PINK = "\x1b[35m"
const FG_CYAN = "\x1b[36m";
const FG_BOLD = "\x1b[1m";
const FG_NORMAL = "\x1b[0m";

let prefectServerConfigCache = {};

// -------------stage_1 begins-------------
// get parser-pipeline,threshold,flow_name and project_name from etl_config.

const ALL_ETL_CONFIGS = new Array();

async function get_config_data(parserPipelineId,dbInstance) {
    let collectionName = "etlconfigs";
    console.log("connecting to etl-config collection");
    let etlConfigData = await dbInstance.collection(collectionName);
    console.log("getting all config from etl-config collection");
    let configData;
    if (parserPipelineId) {
        configData = await etlConfigData.findOne({ _id: ObjectId(parserPipelineId)});
        ALL_ETL_CONFIGS.push(configData);
    } else {
        configData = etlConfigData.find();
        
        while (await configData.hasNext()) {
            const currentConfig = await configData.next();
            if(currentConfig){
                ALL_ETL_CONFIGS.push(currentConfig);
                ALL_ETL_CONFIGS.push(currentConfig);
            }
        };
    }
    console.log("pushing the configs to 'all_configs' array");


    // make an object with the following structure
    /*
        projectName:{
            flowName:{
                parserPipeline:{
                    pipelineId:[],
                    threshold: ...
                }
            }
        }
    */

    let config_structure_object = new Object();
    console.log("running a loop on 'ALL_ETL_CONFIGS' array to restructure the etl-configs");

    for (let i = 0; i < ALL_ETL_CONFIGS.length; i++) {
        // grab the current project name;
        let current_project = ALL_ETL_CONFIGS[i].etlProjectName;
        let current_flowname = ALL_ETL_CONFIGS[i].etlFlowName;
        let current_parser_pipeline = ALL_ETL_CONFIGS[i].etlParserPipeline;
        let current_threshold = ALL_ETL_CONFIGS[i].threshold;
        let prefectServerId = ALL_ETL_CONFIGS[i].prefectServerId.toString();
        
        // check for this config in cache once, before getting it from "prefectserver" collection in mongo
        if (!Object.keys(prefectServerConfigCache).includes(prefectServerId)) {

            // get all the prefect server configs and store the server_name and apolloUri in cache
            let prefectServerConfigCollection = await dbInstance.collection("prefectservers");
            let prefectServerConfig = await prefectServerConfigCollection.findOne({ _id: ObjectId(ALL_ETL_CONFIGS[i].prefectServerId) });
            // save the apolloUri in cache
            prefectServerConfigCache[prefectServerId] = prefectServerConfig.apolloUri;

        }

        let prefectURI = prefectServerConfigCache[prefectServerId];

        // check if that project exists or not in config_structure_object
        if (!(Object.keys(config_structure_object).includes(current_project))) {
            config_structure_object[current_project] = {};
            config_structure_object[current_project][current_flowname] = {};
            config_structure_object[current_project][current_flowname][current_parser_pipeline] = { 'pipelines': [], 'threshold': current_threshold, 'prefectUri': prefectURI };
        } else {
            if (Object.keys(config_structure_object[current_project]).includes(current_flowname)) {
                if (!(Object.keys(config_structure_object[current_project][current_flowname]).includes(current_parser_pipeline))) {
                    config_structure_object[current_project][current_flowname][current_parser_pipeline] = { 'pipelines': [], 'threshold': current_threshold, 'prefectUri': prefectURI };
                }
            } else {
                config_structure_object[current_project][current_flowname] = {};
                config_structure_object[current_project][current_flowname][current_parser_pipeline] = { 'pipelines': [], 'threshold': current_threshold, 'prefectUri': prefectURI };
            }
        }
    }
    return config_structure_object;
};
// -------------stage_1 ends---------------


// -------------stage_2 begins-------------
// Search job_statuses collection and get all pipelines_id in last 10 days where parser_pipeline is what we got in step_1 and etl_finished is false or does not exist
async function get_job_status_data(config_structure_object, days, clientId, page_type,dbInstance) {
    let collectionName = "jobstatuses";
    let jobStatusData = await dbInstance.collection(collectionName);
    let requiredWindow = days * 24 * 60 * 60 * 1000;
    let currentTime = new Date();
    let pastTime = currentTime.getTime() - requiredWindow;
    pastTime = new Date(pastTime);

    let projects = Object.keys(config_structure_object);

    for (let i = 0; i < projects.length; i++) {

        let current_project = projects[i]
        let available_flow_names = Object.keys(config_structure_object[current_project]);

        for (let j = 0; j < available_flow_names.length; j++) {

            let current_flow_name = available_flow_names[j];

            if (config_structure_object[current_project][current_flow_name]) {

                let available_parser_pipelines = Object.keys(config_structure_object[current_project][current_flow_name]);

                for (let k = 0; k < available_parser_pipelines.length; k++) {

                    let current_parser_pipeline = available_parser_pipelines[k];

                    if (config_structure_object[current_project][current_flow_name][current_parser_pipeline]) {

                        let pipelines = config_structure_object[current_project][current_flow_name][current_parser_pipeline]['pipelines'];
                        let jobStatus;

                        let queryFilter = {
                            "parser.pipeline": current_parser_pipeline,
                            "source.page_type": page_type !== undefined ? page_type : undefined,
                            "clientId": Number.isNaN(clientId) ? undefined : clientId,
                            "createdAt": { $gte: pastTime }
                        };

                        // remove keys having undefined value
                        Object.keys(queryFilter).forEach(key => queryFilter[key] === undefined && delete queryFilter[key])

                        jobStatus = jobStatusData.find({ ...queryFilter });

                        while (await jobStatus.hasNext()) {

                            let current_job_status = await jobStatus.next();

                            if (!current_job_status.etl_finished && !(pipelines.includes(current_job_status._id.toString()))) {

                                pipelines.push(current_job_status._id.toString());
                            }
                        }
                    }
                }
            }

        }
    }

    return config_structure_object;
}
// -------------stage_2 ends---------------


// utility function to get the value of any key in a deeply nested json object
function getKeyValue(obj, key, result_array) {
    
    let required_key = key;
        let result = null;
        for (let prop in obj) {
            if (prop === required_key) {
                result_array.push(obj[prop]);
                return obj[prop];
            }
            if (obj[prop] instanceof Object || obj[prop] instanceof Array) {
                result = getKeyValue(obj[prop], required_key, result_array)
                if (result) {
                    break;
                }
            }
        }
}


// TODO: Check why pipelines are duplicated in different projects when parserPipeline is same


// -------------stage_3 and stage_4 begins-------------
// Search prefect using parser_pipeline, flow_name and project_name which we got in [1] for all those pipeline-id and save their status.
/**
 * @param {mode} ==> it's the flag to check if script is running in debug mode, or quiet mode
 */
async function get_prefect_data(config_structure_object, mode,dbInstance) {
    try {
        let jobStatusData = await dbInstance.collection("jobstatuses");

        console.log("getting data from prefect");

        let projects = Object.keys(config_structure_object);
        let project_pipelines = new Object();
        let flows_threshold_array = new Array();
        let nested_pipeline_array = new Array();

        // get all the threshold of all flows & pipeline_id in a project using above utility function
        for (let i = 0; i < projects.length; i++) {
            let flows = Object.keys(config_structure_object[projects[i]]);
            for(let j=0;j<flows.length;j++){
                let parserPipelineArray = Object.keys(config_structure_object[projects[i]][flows[j]]);
                for(let k=0;k<parserPipelineArray.length;k++){
                    getKeyValue(config_structure_object[projects[i]][flows[j]][parserPipelineArray[k]], 'threshold', flows_threshold_array);
                    getKeyValue(config_structure_object[projects[i]][flows[j]][parserPipelineArray[k]], 'pipelines', nested_pipeline_array);
                }
            }
        }
        let previous_parser_pipeline_count = 0;

        // save those pipeline_id's in JSON object where key is 'project_name' and value is the array of all 'pipeline_id' in that project, which matches our query
        for (let i = 0; i < projects.length; i++) {
            let pipelines = [];
            let all_flow_name = Object.keys(config_structure_object[projects[i]]);
        
            for(let j =0 ;j<all_flow_name.length; j++){
                let current_parser_pipeline_count = Object.keys(config_structure_object[projects[i]][all_flow_name[j]]).length;
                // flatten the nested pipeline_array of a project
                pipelines = nested_pipeline_array.slice(previous_parser_pipeline_count, previous_parser_pipeline_count + current_parser_pipeline_count).flat();
                project_pipelines[projects[i]] = project_pipelines[projects[i]] ? [...project_pipelines[projects[i]],...pipelines] : pipelines;
                previous_parser_pipeline_count = previous_parser_pipeline_count + current_parser_pipeline_count;
            }
            
        }
        // get prefect status for each pipeline-id --> use project-name and pipeline-id to get status;
        // make a JSON object 'pipeline_state' and then save the result of each pipeline_id, which is provided by prefect API

        /*
            The expected JSON structure is :
                project_name:{
                    pipeline_id_value_as_key: {
                        threshold: threshold_value
                        state:prefect_state,
                        last_crawl_time: <get it from parser-collection in mongoDB>,
                        threshold_passed: True/False
                    },
                    pipeline_id_value_as_key: {
                        threshold: threshold_value
                        state:prefect_state,
                        last_crawl_time: <get it from parser-collection in mongoDB>,
                        threshold_passed: True/False
                    },
                    .......
                    .......
                    pipeline_id_value_as_key: {
                        threshold: threshold_value
                        state:prefect_state,
                        last_crawl_time: <get it from parser-collection in mongoDB>,
                        threshold_passed: True/False
                    }                
                }
        */
        let pipeline_state = new Object();

        for (let i = 0; i < Object.keys(project_pipelines).length; i++) {

            let pipelines = project_pipelines[projects[i]];
            // Remove all the blacklisted pipelines
            pipelines = pipelines.filter((pipeline_id) => !checkPipelineInBlacklist(pipeline_id));

            pipeline_state[projects[i]] = {};

            let currentParserCollection, parser_collection;

            for (let j = 0; j < pipelines.length; j++) {

                // get flow_name using pipeline_id from jobStatus and etlConfig collection in mongoDB

                let pipeline_jobstatus_data = await jobStatusData.findOne({ _id: ObjectId(pipelines[j]) })
                let pageType =  pipeline_jobstatus_data.source.page_type;
                let searchType =  pipeline_jobstatus_data.source.type;
                let parserPipeline =  pipeline_jobstatus_data.parser.pipeline;
                let parserCollection =  pipeline_jobstatus_data.parser.collections;
                let etl_finished =  pipeline_jobstatus_data.etl_finished;
                parserCollection = parserCollection.slice(-1).pop();

                // get last_crawl_time (or, last_parser_time, if available) from parser_collection of mongoDB

                // Re-write connection to parser-collection only when it's changed otherwise use old connection

                if(currentParserCollection !== parserCollection){
                    console.log("New Parser Collection detected");
                    parser_collection = await dbInstance.collection(parserCollection);
                    currentParserCollection = parserCollection;
                }
                
                /**
                 * * If any documents inside a parser collection contains "parse_time", use it to compare it with threshold.
                 * * If the threshold is passed, set the flag "threshold_passed" to true.
                 * * If the "parse_time" is not available use "crawl_time", the old set-up
                 */


                const latest_parser_collection_document = await (parser_collection.find({ pipeline_id: pipelines[j] }).sort({_id:-1}).limit(1).next());

                /**
                 * ! "pageType" of few legacy(or, old) jobs can be undefined and null.
                 * ! This check ensures that the pageType are interpreted correctly for querying in the etlConfig collection.
                 * * NOTE: 'undefined' and undefined are different (one is a string having string data-type while the latter is undefined having undefined data-type).
                */

                if (pageType === undefined && typeof pageType === 'undefined' && searchType === 'keywords') {
                    pageType = 'serp';
                } else if (pageType === undefined || pageType === null && typeof pageType === 'undefined' || typeof pageType === 'object') {
                    pageType = 'undefined';
                }

                let pipeline_config = ALL_ETL_CONFIGS.filter((config) => 
                    config["pageType"] === pageType && config["etlParserPipeline"] === parserPipeline
                )[0];
                
                let pipeline_threshold, dbContext, dbParameter, defaultContext, defaultParameter, prefectURI;

                if (pipeline_config) {
                    pipeline_threshold = pipeline_config.threshold;
                    defaultContext = {
                        "schema": pipeline_config.schemaName,
                        "table": pipeline_config.tableName,
                        "mongodb_type": "production",
                        "postgresdb_type": "production"
                    };
                    defaultParameter = {
                        "translate_fields": ['title']
                    }
                    // grab the context and parameter from etl_config
                    if (pipeline_config.context) {
                        if (pipeline_config['context'].trim().length !== 0) {
                            dbContext = JSON.parse(pipeline_config.context);
                        }
                    } else {
                        dbContext = undefined;
                    }
                    if (pipeline_config.parameter) {
                        if (pipeline_config['parameter'].trim().length !== 0) {
                            dbParameter = JSON.parse(pipeline_config.parameter);
                        }
                    } else {
                        dbParameter = undefined;
                    }
                    prefectURI = prefectServerConfigCache[ObjectId(pipeline_config.prefectServerId)];
                } else {
                    blacklistPipeline(pipelines[j]);
                    pipeline_threshold = "undefined";
                    continue;
                }
                
                // get state from prefect by providing the pipeline_id and corresponding project_name to which that pipeline_id belongs to
                let flowRunData = await getFlowRunData(pipelines[j], projects[i], prefectURI);
                let state, flowName, flowId;
                let project_name = pipeline_config.etlProjectName;
                let flow_name = pipeline_config.etlFlowName;
                let flow_id = await getFlowId(flow_name, project_name, prefectURI);
                let currentDate = new Date();

                if (flowRunData) {
                    flowName = currentDate.getDate() + currentDate.toLocaleString('default', { month: "short" }) + currentDate.getUTCFullYear() + '-' + pipelines[j];
                    flowId = flow_id;
                    state = flowRunData.state;
                } else {
                    // flowRunData is not available in prefect, so flowname can be grabbed from config and project name and flow name shall be passed to prefect to get flowId
                    flowName = currentDate.getDate() + currentDate.toLocaleString('default', { month: "short" }) + currentDate.getUTCFullYear() + '-' + pipelines[j];
                    flowId = flow_id;
                    state = "Not executed yet";
                }

                let current_time = new Date();
                let threshold_passed,latest_update_time;

		        let parseTimeAvailable = false;
                if(latest_parser_collection_document){
                    parseTimeAvailable = !!(latest_parser_collection_document['parse_time']);
                    latest_update_time = parseTimeAvailable ? new Date(latest_parser_collection_document.parse_time) : new Date(latest_parser_collection_document.crawl_time);

                    if (pipeline_threshold <= ((current_time - latest_update_time) / 1000)) {
                        threshold_passed = true;
                    } else {
                        threshold_passed = false;

                    }
                }else{
                    threshold_passed = false;
                    latest_update_time = "undefined";
                };

                pipeline_state[projects[i]][pipelines[j]] = { 'state': state, 'threshold': pipeline_threshold, 'threshold_passed': threshold_passed, 'parserPipeline': parserPipeline, 'flowname': flowName, 'flowId': flowId, 'dbContext': dbContext, 'dbParameter': dbParameter, 'defaultContext': defaultContext, 'defaultParameter': defaultParameter, 'etl_finished': etl_finished, 'prefectUri': prefectURI, ...(parseTimeAvailable ? {"last_parse_time" : latest_update_time} : {"last_crawl_time" : latest_update_time}) };

                if (mode !== "debug") {
                    console.log(FG_BOLD, FG_PINK, `${projects[i]} <===>`, FG_YELLOW, `${pipeline_state[projects[i]][pipelines[j]]['parserPipeline']} <===>`, FG_CYAN, `${pipelines[j]} <===>`, FG_PINK, `${pipeline_state[projects[i]][pipelines[j]]['state']}`, FG_NORMAL);
                } else {
                    console.log(pipeline_state);
                }
            }

        }
        return pipeline_state;
    } catch (error) {
        console.log(error, 'get prefect data error');
        let error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack
        };
        errorLogger.error(error_obj);
    }
}
// -------------stage_3 and stage_4 ends---------------

//------recommendation filter function begins----------
function recommendationFilter(pipelineId_state_object) {

    let parseTimeAvailable = Object.keys(pipelineId_state_object).includes('last_parse_time');

    let last_update_time = parseTimeAvailable ? pipelineId_state_object['last_parse_time'] : pipelineId_state_object['last_crawl_time'];

    let pipelineId = Object.keys(pipelineId_state_object)[0];
    let state = pipelineId_state_object[pipelineId]['state'];
    let threshold_passed = pipelineId_state_object[pipelineId]['threshold_passed'];
    let etl_finished = pipelineId_state_object[pipelineId]['etl_finished'];

    let recommendation_msg, etl_allowed;

    if (state !== "Not executed yet") {

        if (state === "Scheduled" || state === "Submitted" || state === "Running") {
            recommendation_msg = "ETL already in progress, Do not run as it may cause data duplicity.";
            etl_allowed = false;
        }

        if (!recommendation_msg) {
            if (last_update_time !== "undefined" && (state === "Success" || state === "Failed")) {
                if (state === "Success") {
                    if (threshold_passed) {
                        recommendation_msg = "ETL probably is successful. Running it again may cause data duplicity.";
                        etl_allowed = false;
                        if (!etl_finished) {
                            etl_allowed = true;
                        }
                    } else {
                        recommendation_msg = "ETL is complete, however data is still getting crawled. It is recommended to delete old data processed via ETL and wait for crawl to finish before running ETL again.";
                        etl_allowed = false;
                    }
                } else {
                    if (threshold_passed) {
                        recommendation_msg = "Go ahead. You may run the ETL.";
                        etl_allowed = true;
                    } else {
                        recommendation_msg = "Crawling still in progress. Running ETL may lead to incomplete data processing. Only proceed if you are sure data is fully crawled.";
                        etl_allowed = false;
                    }
                }
            } else {
                if (state === "Success") {
                    recommendation_msg = "Looks like data isn’t there. Running ETL is not recommended as it will probably fail.";
                    etl_allowed = false;
                } else if (state === "Failed") {
                    recommendation_msg = "Looks like data isn’t there. Running ETL is not recommended as it will probably fail.";
                    etl_allowed = false;
                }
            }
        }
    } else {
        if (last_update_time !== "undefined") {
            if (threshold_passed) {
                recommendation_msg = "Go ahead. You may run the ETL.";
                etl_allowed = true;
            } else {
                recommendation_msg = "Crawling still in progress. Running ETL may lead to incomplete data processing. Only proceed if you are sure data is fully crawled.";
                etl_allowed = false;
            }
        } else {
            recommendation_msg = "Looks like data isn’t there. Running ETL is not recommended as it will probably fail.";
            etl_allowed = false;
        }
    }
    let recommendation_obj = {
        "msg": recommendation_msg,
        "allowed": etl_allowed
    };
    return recommendation_obj;
}
//----recommendation filter function ends-------

// ------------stage_5 begins--------------
async function getRecommendation(pipeline_state) {
    let recommendation_obj;
    let projects = Object.keys(pipeline_state);

    for (let i = 0; i < projects.length; i++) {

        let pipelineId_state_object_keys = Object.keys(pipeline_state[projects[i]]);

        for (let j = 0; j < pipelineId_state_object_keys.length; j++) {

            let pipelineId_state_object = pipeline_state[projects[i]][pipelineId_state_object_keys[j]];
            let id = pipelineId_state_object_keys[j];

            pipelineId_state_object = { [id]: pipelineId_state_object };
            recommendation_obj = recommendationFilter(pipelineId_state_object);

            pipelineId_state_object[id]['recommendation'] = recommendation_obj['msg'];

            pipelineId_state_object[id]['runETL'] = recommendation_obj['allowed'];

            // put a logger here, for pipelines which are ready to be ETL and which are not ready to be ETL
            let message = {
                "pipelineId": id,
                "project": projects[i],
                "etl_msg": recommendation_obj['msg'],
                "etl_allowed": recommendation_obj['allowed']
            }

            infoLogger.info(message);
        }
    }

    return pipeline_state;
}

// This function hits prefect to execute ETL spontaneously
async function startEtlNow(flowId, flow_run_name, etlParameter, etlContext, currentId, currentProject, pipeline_state_with_recommendation, prefectURI) {

    if (pipeline_state_with_recommendation) {
        try {
            let flow_run = await runEtlNow(flowId, flow_run_name, etlParameter, etlContext, prefectURI)
            let flowRunId = await JSON.parse(flow_run).create_flow_run.id;

            let message = {
                "pipelineId": currentId,
                "project": currentProject,
                "flowId": flowId,
                "flowRunId": flowRunId,
            };

            infoLogger.info(message)

            pipeline_state_with_recommendation[currentProject][currentId]['flow_run_id'] = flowRunId;
        } catch (error) {
            console.log(error, 'start ETL now');
            let error_obj = {
                "name": error.name,
                "pipelineId": currentId,
                "project": currentProject,
                "message": error.message,
                'stack': error.stack
            };
            errorLogger.error(error_obj);
        }
    }
}

// -----Final stage => ETL_executor begins------
async function executeETL(pipeline_state_with_recommendation, initialParameters, initialContext) {

    try {

        let projects = Object.keys(pipeline_state_with_recommendation);

        for (let i = 0; i < projects.length; i++) {
            let id = Object.keys(pipeline_state_with_recommendation[projects[i]]);

            for (let j = 0; j < id.length; j++) {
                let runETL = pipeline_state_with_recommendation[projects[i]][id[j]]['runETL'];
                if (runETL) {
                    // get flowId of that pipeline_id from prefect
                    // the parameters and context are default, for now
                    // flow_run_name is "dateMonth-pipelineid"
                    let flowId = pipeline_state_with_recommendation[projects[i]][id[j]]['flowId'];

                    let dbContext = pipeline_state_with_recommendation[projects[i]][id[j]]['dbContext'];
                    let defaultContext = pipeline_state_with_recommendation[projects[i]][id[j]]['defaultContext'];
                    let defaultParameter = pipeline_state_with_recommendation[projects[i]][id[j]]['defaultParameter'];
                    let dbParameter = pipeline_state_with_recommendation[projects[i]][id[j]]['dbParameter'];
                    let prefectURI = pipeline_state_with_recommendation[projects[i]][id[j]]['prefectUri'];

                    let current_date = new Date();
                    let date = current_date.getDate();
                    let month = current_date.toLocaleString('default', { month: 'short' })
                    let flow_run_name = date + month + '-' + id[j];

                    let parameter, context;

                    /*
                    ? parameters and context precedence order:
                    * initialParamert(or,context) > dbParameter(or,context) > runTimeParameter(or,context)
                    * initial parameter is provided through a file via CLI argument 
                    * DB parameter is provided via etlConfig collection
                    * runTimeParameter(or, default parameter) is hardcoded in the script
                    **/

                    if (!initialParameters) {
                        if (!dbParameter) {
                            parameter = defaultParameter;
                        } else {
                            parameter = dbParameter
                        }
                        parameter['pipeline_id'] = id[j];
                    } else {
                        parameter = initialParameters;
                    }

                    if (!initialContext) {
                        if (!dbContext) {
                            // default etl-context
                            context = defaultContext;
                            context["preferred_seller"] = "unknown";
                        } else {
                            context = dbContext;
                        }
                    } else {
                        context = initialContext;
                    }

                    if (flowId !== "undefined") {
                        let etlParameter, etlContext;

                        etlParameter = parameter;
                        etlContext = context;

                        // logic for prefect agent load balance
                        let availableFlowRunLimit = await agentLoad(prefectURI);
                        console.log(availableFlowRunLimit, 'agent Limit');

                        if (availableFlowRunLimit > 0) {
                            let currentId = id[j];
                            let currentProject = projects[i];
                            await startEtlNow(flowId, flow_run_name, etlParameter, etlContext, currentId, currentProject, pipeline_state_with_recommendation, prefectURI)
                            childProcess.execSync("sleep 5");
                        } else {
                            while (availableFlowRunLimit <= 0) {
                                // sleep for 1 minute 30 seconds
                                childProcess.execSync("sleep 90");
                                availableFlowRunLimit = await agentLoad(prefectURI);
                                console.log(availableFlowRunLimit, 'agent Limit');
                            }
                            if (availableFlowRunLimit > 0) {
                                await startEtlNow(flowId, flow_run_name, etlParameter, etlContext, pipeline_state_with_recommendation)
                            }
                        }

                    }

                }
            }
        }
        return pipeline_state_with_recommendation;
    } catch (error) {
        console.log(error, 'execute etl error');
        const error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack
        }
        errorLogger.error(error_obj);
    }
}
// -----Final stage => ETL_executor ends--------

// -----------driver code begins-----------
async function automateEtl(day, parserPipelineId, clientId, parameters, context, page_type, mode, environment,dbInstance) {
    let automation_done = false;
    try {
        let all_configs = await get_config_data(parserPipelineId,dbInstance);
        // check for mode === debug
        if (mode === "debug") { console.log(all_configs['1DS-Prod']['Product-page'], FG_BOLD, FG_YELLOW, '\nGetting the required ETL config --> [*] Stage-1 finished successfully.', FG_NORMAL) };

        let modified_config = await get_job_status_data(all_configs, day, clientId, page_type,dbInstance);
        // check for mode === debug
        if (mode === "debug") { console.log(modified_config['1DS-Prod']['Product-page'], FG_BOLD, FG_YELLOW, '\nModified ETL config --> [*] Stage-2 finished successfully.', FG_NORMAL) };
        
        let project_pipelines_state = await get_prefect_data(modified_config, mode, dbInstance);
        // check for mode === debug
        if (mode === "debug") { console.log(FG_BOLD, FG_YELLOW, '\nProject pipelines and state (from prefect) --> [*] Stage-3 and Stage-4 finished successfully.\n', FG_NORMAL) };

        let pipeline_state_with_recommendation = await getRecommendation(project_pipelines_state);
        // check for mode === debug
        let projectsIdentifiedForEtl = Object.keys(pipeline_state_with_recommendation);

        projectsIdentifiedForEtl.forEach(project => {

            console.log(FG_BOLD, FG_YELLOW, `\n${project}`, FG_NORMAL);


            let pipelinesIdentifiedforEtl = Object.keys(pipeline_state_with_recommendation[project]);
            let trueCount = 0, falseCount = 0;

            let previousParserPipeline;

            pipelinesIdentifiedforEtl.forEach(pipeline => {
                let parserPipelinesIdentifiedForEtl = pipeline_state_with_recommendation[project][pipeline]['parserPipeline'];

                if (previousParserPipeline !== parserPipelinesIdentifiedForEtl) {
                    console.log(FG_BOLD, FG_PINK, parserPipelinesIdentifiedForEtl, FG_NORMAL);
                    previousParserPipeline = parserPipelinesIdentifiedForEtl;
                }
                console.log(FG_CYAN, '\t', pipeline, FG_NORMAL, ' ===> ', pipeline_state_with_recommendation[project][pipeline]['runETL']);

                if (pipeline_state_with_recommendation[project][pipeline]['runETL'] === true) {
                    trueCount += 1;
                } else {
                    falseCount += 1;
                }
            });
            console.log(FG_BOLD, FG_YELLOW, `\nTotal number of pipelines identified = ${pipelinesIdentifiedforEtl.length}`);
            console.log(FG_BOLD, FG_YELLOW, `\nTotal number of pipelines to be processed for ETL = ${trueCount}`);
            console.log(FG_BOLD, FG_YELLOW, `\nTotal number of pipelines not allowed for ETL = ${falseCount}`, FG_NORMAL);
        })

        // check for environment === test or not.
        // if environment === test, do not run the script, otherwise execute it
        if (environment !== "test") {
            let etl_executor = await executeETL(pipeline_state_with_recommendation, parameters, context);
        } else {
            console.log(FG_BOLD, FG_YELLOW, "\nThe script was executed in 'test' environment. This means that none of the pipeline-ids were sent for ETL process.", FG_NORMAL)
        }

        automation_done = true;
        return automation_done;
    } catch (error) {
        console.log(error, 'automate etl error')
        const error_obj = {
            "name": error.name,
            "message": error.message,
            "stack": error.stack
        };
        errorLogger.error(error_obj);
        automation_done = true;
        return automation_done;
    }
}
// ------------driver code ends------------

/**
* @param (days,parserPipelineId,parameters,context)
* * day is required
* * parserPipelineId, parameters and context are optional
*/



program
    .version('1.0.0', '-v, --version')
    .description("Starts the ETL automation process based on ETL recommendation system.")

program
    .requiredOption('-d, --day <number of days>', 'Enter number of days for which pipelineId should go under ETL process')
    .option('-i, --parser-pipeline-id <ObjectId of etl-config having that parser-pipeline>', 'parser pipeline Id whose pipelines shall go under ETL automation')
    .option('--client-id <Client ID>', 'client-id of any client, if ETLs to be automated for any specific client')
    .option('-p, --initial-parameter <Path to initial parameter file>', 'Path to initial parameter JSON file')
    .option('-c, --initial-context <Path to initial context file>', 'Path to initial context JSON file')
    .option('--page-type <page_type in jobStatuses collection>', 'Enter the page-type of a particular parser pipeline for finer control')
    .option('-m, --mode <mode of the script>', 'Start the script in debug(verbose output) mode [-m/--mode debug]')
    .option('--env <environment of the script>', 'Start the script in test mode(no ETLs are executed [--env test]')
    .parse()
    .description('Starts the ETL process for the given numnber of days based on recommendation.')

const opts = program.opts();

let day = opts.day;
let parserPipelineId = opts.parserPipelineId;
let clientId = parseInt(opts.clientId);
let initialParametersFilePath = opts.initialParameter;
let initialContextFilePath = opts.initialContext;
let page_type = opts.pageType;
let mode = opts.mode;
let environment = opts.env;

let initialParameters, initialContext;

if (fs.existsSync(initialParametersFilePath)) {
    initialParameters = JSON.parse(fs.readFileSync(initialParametersFilePath));
};

if (fs.existsSync(initialContextFilePath)) {
    initialContext = JSON.parse(fs.readFileSync(initialContextFilePath));

};
async function startEtlAutomatically(day, parserPipelineId, clientId, initialParameters, initialContext, page_type, mode, environment) {

    MongoClient.connect(mongo_uri,async (err,client) => {
        if(err){
            console.log(err,"err");
            errorLogger.error(err);
            return;
        };
        await client.connect();
        const dbInstance = client.db();

        infoLogger.info("MongoDB connection pool established");

        let automation_done = await automateEtl(day, parserPipelineId, clientId, initialParameters, initialContext, page_type, mode, environment, dbInstance);

        if (automation_done) {
            setTimeout(async () => { 
                await client.close();
                process.exit()
            }, 1000);
        };
    });
};

startEtlAutomatically(day, parserPipelineId, clientId, initialParameters, initialContext, page_type, mode, environment);
