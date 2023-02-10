const express = require("express");
const authenticate = require("../middleware/auth-middleware")
const router = express.Router();
const authController = require("../controllers/auth");

router.get("/login",authController.login);

router.get("/login/callback",authController.callback);

router.get("/logout",authenticate.authenticateUser,authController.logout);

module.exports = router;