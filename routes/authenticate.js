const AuthenticateController = require("../controllers/authenticate");
const express = require("express");
const router = express.Router();

router.get("/cookie", AuthenticateController.authenticateUserWithCookie);
router.post("/", AuthenticateController.authenticateUser);

module.exports = router;
