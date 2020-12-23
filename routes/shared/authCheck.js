const jwt = require("jsonwebtoken");
var common = require('../../common');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, common.secret_key);
    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication Failed!",
      error: "Authentication Failed! Please Login First!"
    });
  }
};
