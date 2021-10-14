import jwt from 'jsonwebtoken';
import { Common, CommonService } from './common.js';

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

export const verifyUser = (request, next) => {
  const common: CommonService = Common;
  try {
    const [path, queryParams] = (request.url && typeof request.url === 'string') ? request.url.split('?') : ['', ''];
    const token = queryParams.substring(6);
    jwt.verify(token, common.secret_key);
    next();
  } catch (error) {
    const errMsg = 'Authentication Failed! Please Login First!';
    const err = common.handleError({ statusCode: 401, message: 'Authentication Error', error: errMsg }, 'AuthCheck', errMsg);
    next({ message: err.message, error: err.error });
  }
};
