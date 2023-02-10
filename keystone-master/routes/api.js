const express = require("express");

const router = express.Router();

const apiController = require("../controllers/api");


router.get("/runJob", apiController.runJob);
router.get("/runJobManual/:clientId/:jobId", apiController.runJobManual);
router.get("/getflowrun/:pipeline_id/:flowname/:projectname/:prefectServerId", apiController.getFlowRun);
router.get("/getflowid/:flowname/:projectname/:prefectServerId", apiController.getFlowId)

module.exports = router;