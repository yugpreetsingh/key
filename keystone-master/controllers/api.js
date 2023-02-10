const jobsController = require("./jobs");
const Jobs = require("../models/jobs");
const moment = require("moment");
const getFlowRunData = require("../util/prefectFlowRunData");
const prefectServerConfig = require("../models/prefectServerConfig");
const { getFlowId } = require("../util/getFlowNameId");

const apiController = {
    runJobManual:async(req,res,next) =>{
        req.params.fromApi = true;
        let result = await jobsController.runJob(req, res, next);
        res.send(result);
    },
    runJob: async (req, res, next) => {
        // Get All Jobs
        const currentTime = moment();
        console.log(
            `Current Hour: ${currentTime.hours()}, Current Minutes: ${currentTime.minutes()}, Current Day: ${currentTime.day()}`
        );
        const jobs = await Jobs.find({
            $and: [
                {
                    "frequency.type": "scheduled",
                    "frequency.times": {
                        $elemMatch: {
                            hours: currentTime.hours(),
                            minutes: currentTime.minutes(),
                        },
                    },
                },
                {
                    $or: [
                        {
                            "frequency.day": "*",
                        },
                        {
                            "frequency.day": currentTime.day(),
                        },
                    ],
                },
            ],
        }).lean();
        const result = [];
        jobs.forEach(async (obj) => {
            console.log(
                moment().format("DD-MMM-YYYY HH:mm:ss:SSSS"),
                obj._id.toString(),
                "Matched"
            );
            req.params.jobId = obj._id.toString();
            req.params.clientId = obj.clientId.toString();
            req.params.fromApi = true;

            jobsController.runJob(req, res, next);

            result.push({
                id: obj._id.toString(),
                name: obj.name,
                frequency: obj.frequency,
                date: moment().format("DD-MMM-YYYY HH:mm:ss"),
            });
        });

        res.json(result);
    },

    // Get the current status of a job in a flow (e.g., Running,Scheduled,Success,Failed)
    // use flowName parameter when the job isn't found in prefect(i.e., ETL hasn't been executed even for once) to get the flowId from prefect API

    getFlowRun: async (req, res, next) => {
        let prefectServerInfo = await prefectServerConfig.findById({ _id: req.params.prefectServerId });
        let apolloUri = prefectServerInfo.apolloUri;
        let dashboardUri = prefectServerInfo.dashboardUri;
        let pipelineId = req.params.pipeline_id;
        let flowName = req.params.flowname;
        let projectName = req.params.projectname;

        if (req.isAuthenticated()) {

            let flow_run_data = {};
            let flowId = await getFlowId(flowName, projectName, apolloUri);
            flow_run_data["flowid"] = flowId;

            await getFlowRunData(pipelineId, projectName, apolloUri)
                .then(async (res) => {
                    if (res !== null && res.length !== 0) {
                        flow_run_data = { ...flow_run_data, ...res };
                        flow_run_data['dashboardUri'] = dashboardUri;
                    } else {
                        // If the pipelineId isn't found in prefect, get the flowId of that pipelineId from prefect
                        // const flowId = await getFlowId(flowName, projectName, apolloUri);
                        flow_run_data["state"] = "ETL not started yet";
                        // flow_run_data["flowid"] = flowId;
                    }
                })
                .catch((err) => console.log(err));
            res.json(flow_run_data);
        } else {
            res.status(403).json({ error: "Not Authorized" })
        }

    },

    getFlowId: async (req, res, next) => {
        let prefectServerInfo = await prefectServerConfig.findById({ _id: req.params.prefectServerId });
        let apolloUri = prefectServerInfo.apolloUri;
        let projectName = req.params.projectname;
        let flowName = req.params.flowname;

        let flowId = await getFlowId(flowName, projectName, apolloUri);
        res.json(flowId);
    }

};

module.exports = apiController;
