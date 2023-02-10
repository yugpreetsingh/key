const express = require("express");

const router = express.Router();

const welcomeController = require("../controllers/welcome");

router.get("/",welcomeController);

module.exports = router;