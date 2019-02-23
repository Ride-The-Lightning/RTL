const AuthenticateController = require("../controllers/authenticate");
const express = require("express");
const router = express.Router();

router.get("/:pwd", AuthenticateController.redirectUser);
router.post("/", AuthenticateController.authenticateUser);

module.exports = router;
