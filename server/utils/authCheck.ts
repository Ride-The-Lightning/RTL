import { parse } from 'cookie';
import * as cookieParser from 'cookie-parser';
import CSRF from './csrf.js';
import { Common, CommonService } from './common.js';
import { Logger, LoggerService } from './logger.js';
import { isSessionTokenFor } from './sessionToken.js';

const common: CommonService = Common;
const logger: LoggerService = Logger;
const csurfProtection = CSRF.csrfProtection;

export const isAuthenticated = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!isSessionTokenFor(token, req.session.id)) { throw new Error('Not a live token of this session'); }
    next();
  } catch (error) {
    const errMsg = 'Authentication Failed! Please Login First!';
    const err = common.handleError({ statusCode: 401, message: 'Authentication Error', error: errMsg }, 'AuthCheck', errMsg, req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  }
};

// The selected node lives on the session, which every tab of a browser shares, while each tab
// keeps the node it showed at load. After a switch in one tab, another tab's requests for the
// old node would run against the new node's settings: a CLN controller would call the LND
// node's REST URL (issue #1742). Refuse a request whose implementation does not match the
// session's node, so the tab can re-sync instead. An unauthenticated caller gets the usual 401
// first, so the reply says nothing about the selected node to someone not logged in.
const IMPLEMENTATION_ALIASES = { CLT: 'CLN' };

export const isSelectedNodeImplementation = (lnImplementation: string) => (req, res, next) => {
  const selNodeImplementation = (req.session?.selectedNode?.lnImplementation || '').toUpperCase();
  if (!selNodeImplementation || (IMPLEMENTATION_ALIASES[selNodeImplementation] || selNodeImplementation) === lnImplementation) {
    return next();
  }
  return isAuthenticated(req, res, () => {
    const errMsg = 'This page is for ' + lnImplementation + ', but the selected node is ' + req.session.selectedNode.lnNode + ' (' + selNodeImplementation +
      '). It was probably switched in another tab; reload this page.';
    const err = common.handleError({ statusCode: 409, message: 'Selected Node Mismatch', error: errMsg }, 'AuthCheck', 'Selected Node Mismatch', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

// The websocket handshake does not pass through the session middleware, so the session id is
// read from the signed session cookie. verifyWSUser and mountEventsOnConnection both use this,
// so the session a socket was let in for is the one closeClientsOfSessions matches it by.
export const sessionIdOfCookieHeader = (cookieHeader) => {
  const cookies = cookieHeader ? parse(cookieHeader) : {};
  return cookies['connect.sid'] ? cookieParser.signedCookie(cookies['connect.sid'], common.secret_key) : null;
};

export const verifyWSUser = (info, next) => {
  const headers = JSON.parse(JSON.stringify(info.req.headers));
  const protocols = !info.req.headers['sec-websocket-protocol'] ? [] : info.req.headers['sec-websocket-protocol'].split(',')?.map((s) => s.trim());
  const jwToken = (protocols && protocols.length > 0) ? protocols[0] : '';
  if (!isSessionTokenFor(jwToken, sessionIdOfCookieHeader(info.req.headers.cookie))) {
    next(false, 401, 'Authentication Failed! Please Login First!');
  } else {
    try {
      let updatedReq = null;
      try {
        updatedReq = JSON.parse(JSON.stringify(info.req));
      } catch (err) {
        updatedReq = info.req;
      }
      let cookies = null;
      try {
        cookies = '{"' + headers.cookie?.replace(/ /g, '')?.replace(/;/g, '","').trim()?.replace(/[=]/g, '":"') + '"}';
        updatedReq['cookies'] = JSON.parse(cookies);
      } catch (err) {
        cookies = {};
        updatedReq['cookies'] = JSON.parse(cookies);
        logger.log({ selectedNode: common.selectedNode, level: 'WARN', fileName: 'AuthCheck', msg: '403 Unable to read CSRF token cookie', data: err });
      }
      csurfProtection(updatedReq, null, (err) => {
        if (err) {
          next(false, 403, 'Invalid CSRF token!');
        } else {
          next(true);
        }
      });
    } catch (err) {
      logger.log({ selectedNode: common.selectedNode, level: 'WARN', fileName: 'AuthCheck', msg: '403 Unable to verify CSRF token', data: err });
      next(true);
    }
  }
};
