"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jwt = require("jsonwebtoken");
const common_1 = require("./common");
const isAuthenticated = (req, res, next) => {
    const common = common_1.Common;
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, common.secret_key);
        next();
    }
    catch (error) {
        const errMsg = 'Authentication Failed! Please Login First!';
        const err = common.handleError({ statusCode: 401, message: 'Authentication Error', error: errMsg }, 'AuthCheck', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
};
exports.isAuthenticated = isAuthenticated;
module.exports = { isAuthenticated: exports.isAuthenticated };
