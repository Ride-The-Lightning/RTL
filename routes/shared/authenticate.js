const AuthenticateController = require("../../controllers/shared/authenticate");
const express = require("express");
const router = express.Router();

router.post("/", AuthenticateController.authenticateUser);
router.post("/token", AuthenticateController.verifyToken);
router.post("/reset", AuthenticateController.resetPassword);

module.exports = router;
