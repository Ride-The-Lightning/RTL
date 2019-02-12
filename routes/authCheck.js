const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, "default_secret_key");
    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication Failed!",
      error: "Authentication Failed! Please Login First!"
    });
  }
};
