const express = require("express");

const router = express.Router();
// const Monitoring = require("../models/client");
const monitoringController = require("../controllers/monitoring");

router.get('/', monitoringController.getMonitor);
router.get('/cronjobs',monitoringController.getCronJobs)
router.get('/prefectjobs',monitoringController.getPrefectJobs)
router.get('/amsjobs',monitoringController.getAmsJobs)
router.get('/amsjobs/:clientId/amsjobDetails',monitoringController.getAmsJobDetails)
module.exports = router;

