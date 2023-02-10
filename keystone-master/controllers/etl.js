// This is the ETL-config controller
const etlModel = require("../models/etlconfig");
const prefectConfigModel = require("../models/prefectServerConfig");

const { getFlowNames } = require("../util/flowNames");
const { getAllProjects } = require("../util/prefectProjectNames");
const { getNumberOfRecord } = require("../util/getParserData");
const { runEtlNow } = require("../util/runEtlNow");
const mongoose = require("mongoose");

const axios = require("axios");

const addETLconfig = async function (req, res, next) {
    let isPresent = await etlModel.findOne({ etlParserPipeline: req.body.parserPipeline, etlFlowName: req.body.flowName, etlProjectName: req.body.projectName, pageType: req.body.pageType });

    if (isPresent !== null) {
        res.send("This ETL flow already exist")
    } else {

        let flowdata_query = `
        {
            flow( where:{ name:{_eq:"${req.body.flowName}"}, project: {name: {_eq:"${req.body.projectName}" }}})
            {
                project { name }
                id
                name    
                version
            }
          }
          
        `;
        let prefect_server_info = await prefectConfigModel.findById(req.body.prefectServerId);
        let prefect_uri = prefect_server_info.apolloUri;


        axios.post(prefect_uri, { query: flowdata_query }, { headers: { "Content-Type": "application/json" } })

            .then(async (queryResponse) => {

                let flow_data = queryResponse.data.data.flow;

                // grab the highest version of flow_data
                let maxVersion = 0;
                for (let i = 0; i < flow_data.length; i++) {
                    if (flow_data[i].version > maxVersion) {
                        maxVersion = flow_data[i].version
                    }
                }

                let etldata = new etlModel({
                    domain: req.body.domain,
                    type: req.body.type,
                    threshold: req.body.threshold,
                    etlProjectName: req.body.projectName,
                    etlFlowName: req.body.flowName,
                    etlParserPipeline: req.body.parserPipeline,
                    pageType: req.body.pageType,
                    schemaName: req.body.schemaName,
                    tableName: req.body.tableName,
                    context: req.body.context,
                    parameter: req.body.parameter,
                    prefectServerId: req.body.prefectServerId

                });
                await etldata.save();
                res.json(etldata);
            })
            .catch((err) => {
                console.log(err)
            });

    }
}

const getETLconfig = async function (req, res, next) {
    let etlconfig = await etlModel.find();
    res.json({ ETLdata: etlconfig });

}

const getETLconfigByName = async function (req, res, next) {
    let parserPipeline = req.params.parserPipeline;
    let pageType;
    let flowData;
    if (req.params.pageType !== "undefined" && req.params.pageType !== "null") {
        pageType = req.params.pageType;

        // add pageType and parserPipeline both for finding the config, if pageType exists
        flowData = await etlModel.findOne({ etlParserPipeline: parserPipeline, pageType: pageType });
    } else {
        // add pageType only for finding the config, if pageType is not applicable
        flowData = await etlModel.findOne({ etlParserPipeline: parserPipeline })
    }
    res.json({ ETLdata: flowData });
}

const getFlowNameByProjectName = async function (req, res, next) {
    let prefect_server_info = await prefectConfigModel.findById(req.params.prefectServerId);
    let projectName = req.params.projectName;
    let flow_names = await getFlowNames(projectName, prefect_server_info.apolloUri);
    res.send(flow_names);
}

const getProjectNames = async function (req, res, next) {
    let prefect_server_info = await prefectConfigModel.findById(req.params.prefectServerId);
    let project_info = await getAllProjects(prefect_server_info.apolloUri);
    res.send(project_info);
}

const getTotalRecordsFound = async function (req, res, next) {
    let databaseName = req.params.databaseName;
    let pipeline_id = req.params.pipeline_id

    // call util function
    let numberOfRecords = await getNumberOfRecord(databaseName, pipeline_id);
    res.send(String(numberOfRecords));
}

const executeEtl = async function (req, res, next) {

    let etlExecutionParams = req.body;
    let prefectServerInfo = await prefectConfigModel.findById(etlExecutionParams.prefectServerId);
    let apolloUri = prefectServerInfo.apolloUri;
    let flow_id = etlExecutionParams.etlFlowId;
    let flow_run_name = etlExecutionParams.etlFlowRunName;
    let etl_parameters = JSON.parse(etlExecutionParams.etlParamerers);
    let etl_context = JSON.parse(etlExecutionParams.etlContext);

    try {

        let mutationResponse = await runEtlNow(flow_id, flow_run_name, etl_parameters, etl_context, apolloUri);
        let flowRun = await JSON.parse(mutationResponse);
        res.json({ flowRunId: flowRun.create_flow_run.id });

    } catch (err) {
        console.log(err);
    }

}

module.exports = { addETLconfig, getETLconfig, getETLconfigByName, getProjectNames, getFlowNameByProjectName, getTotalRecordsFound, executeEtl };