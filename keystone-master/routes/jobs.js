const path = require("path");
const express = require("express");
const { check, param } = require("express-validator");

const router = express.Router();

const Client = require("../models/client");
const jobsController = require("../controllers/jobs");

router.get("/", jobsController.getClients);
router.get(
  "/:clientId",
  jobsController.getListAPI
);
router.get("/:clientId/addNew", jobsController.addJobForm);
router.get("/:clientId/editJob/:jobId", jobsController.editJobForm);
router.get("/:clientId/hideJob/:jobId",jobsController.hideJob) //Action -  Hiding the job
router.get("/:clientId/unhideJob/:jobId",jobsController.unhideJob) // Action -- Unhiding the Job
router.get("/hidden/:clientId",jobsController.getHiddenJobListAPI) //Displaying the hiddenjob list
router.post("/:clientId/schedule", jobsController.scheduleJobPost);
router.post("/:clientId/editschedule", jobsController.editscheduleJobPost);
router.get("/:clientId/results/:jobId", jobsController.getResults);
router.get("/spider/:parser", jobsController.getSpiders);
router.post(
  "/addNew",
  [
    check("name")
      .not()
      .isEmpty()
      .withMessage("Name cannot be empty")
      .custom(async (value, { req }) => {
        let name = await Client.findOne({ name: value });
        if (name) {
          return Promise.reject("The name already exists");
        } else {
          return true;
        }
      }),

    check("domain")
      .not()
      .isEmpty()
      .withMessage("Domain name cannot be empty")
      .custom(async (value, { req }) => {
        let domain = await Client.findOne({ domain: value });
        if (domain) {
          return Promise.reject("The domain already exists");
        } else {
          return true;
        }
      }),
  ],
  jobsController.addJobPost
);

router.get("/:clientId/:jobId/run", jobsController.runJob);
router.get("/:clientId/:jobId/results/:batchId", jobsController.getResults);
router.get(
  "/:clientId/:jobId/results/:batchId/:collectionName",
  jobsController.getResults
);
router.get(
  "/:clientId/:jobId/results/:batchId/:collectionName/download",
  jobsController.downloadResults
);
router.post(
  "/:clientId/:jobId/processpending/:batchId",
  jobsController.processPending
);

router.post(
  "/:clientId/:jobId/processblocked/:batchId",
  jobsController.processBlocked
);

router.get("/:clientId/:jobId/details", jobsController.getJobDetails);
router.post("/:clientId/updateFrequency", jobsController.updateFrequency);


// router.get("/logout", authController.logout);

module.exports = router;
