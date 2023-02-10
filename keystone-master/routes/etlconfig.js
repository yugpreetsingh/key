// This route handles all the operation regrading etl_config
const express = require("express");
const router = express.Router();

const { getETLconfig, getETLconfigByName, getFlowNameByProjectName, getProjectNames, getTotalRecordsFound, executeEtl } = require("../controllers/etl");

// Non-admin access part
router.get("/getconfig", getETLconfig);
router.get("/getconfigbyname/:parserPipeline/:pageType", getETLconfigByName);
router.get("/getflownames/:projectName/:prefectServerId", getFlowNameByProjectName);
router.get("/getproject/:prefectServerId", getProjectNames);
router.get("/gettotalrecords/:pipeline_id/:databaseName", getTotalRecordsFound);

router.post("/runetlnow", executeEtl);

module.exports = router;