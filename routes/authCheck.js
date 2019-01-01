const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, "RTL_default_secret_it_can_be_changed_by_user");
    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication Failed!",
      error: "Authentication Failed! Please Login First!"
    });
  }
};
