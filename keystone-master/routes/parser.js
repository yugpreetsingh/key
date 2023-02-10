// This route is for parser-collection data
const express = require("express");

const router = express.Router();

const {parserDataController} = require("../controllers/parser.js");

router.get("/:pipelineId/:parserCollectionName",parserDataController)

module.exports = router;