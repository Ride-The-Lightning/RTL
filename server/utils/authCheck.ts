import * as jwt from 'jsonwebtoken';
import { Common, CommonService } from './common';

export const isAuthenticated = (req, res, next) => {
  const common: CommonService = Common;
  try {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, common.secret_key);
    next();
  } catch (error) {
    const errMsg = 'Authentication Failed! Please Login First!';
    const err = common.handleError({ statusCode: 401, message: 'Authentication Error', error: errMsg }, 'AuthCheck', errMsg);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  }
};

module.exports = { isAuthenticated };
