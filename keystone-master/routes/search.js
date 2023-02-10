const path = require("path");
const express = require("express");

const router = express.Router();

const searchController = require("../controllers/search");

router.get("/", searchController.getSearch);
// router.get("/search", searchController.getSearchList);

module.exports = router;
