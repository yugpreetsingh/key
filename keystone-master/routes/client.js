const path = require("path");
const express = require("express");
const { check, param } = require("express-validator");

const router = express.Router();

const Client = require("../models/client");
const clientController = require("../controllers/client");

router.get("/", clientController.getList);
router.get("/addNew", clientController.addClientForm);
router.post(
  "/addNew",
  // [
  //   check("name")
  //     .not()
  //     .isEmpty()
  //     .withMessage("Name cannot be empty")
  //     .custom(async (value, { req }) => {
  //       let name = await Client.findOne({ name: value });
  //       if (name) {
  //         return Promise.reject("The name already exists");
  //       } else {
  //         return true;
  //       }
  //     }),

  //   check("domain")
  //     .not()
  //     .isEmpty()
  //     .withMessage("Domain name cannot be empty")
  //     .custom(async (value, { req }) => {
  //       let domain = await Client.findOne({ domain: value });
  //       if (domain) {
  //         return Promise.reject("The domain already exists");
  //       } else {
  //         return true;
  //       }
  //     })
  // ],
  // clientController.addClientPost
  clientController.addClientPostAPI
);
// router.get("/logout", authController.logout);

module.exports = router;
