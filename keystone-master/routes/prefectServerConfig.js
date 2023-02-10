const express = require("express");

const router = express.Router();

const { getAllPrefectServerConfig, getPrefectServerByUri } = require("../controllers/prefectServerConfig");

router.get("/getallconfig", getAllPrefectServerConfig);

router.get("/getconfigbyuri", getPrefectServerByUri);

module.exports = router;