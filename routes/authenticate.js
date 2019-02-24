const AuthenticateController = require("../controllers/authenticate");
const express = require("express");
const router = express.Router();

router.post("/", AuthenticateController.authenticateUser);

module.exports = router;
