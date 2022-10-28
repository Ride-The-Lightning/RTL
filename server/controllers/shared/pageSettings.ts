import { Database, DatabaseService } from '../../utils/database.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { CollectionFieldsEnum, CollectionsEnum, PageSettings } from '../../models/database.model.js';

const logger: LoggerService = Logger;
const common: CommonService = Common;
const databaseService: DatabaseService = Database;

export const getPageSettings = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Getting Page Settings..' });
  databaseService.find(req.session.selectedNode, CollectionsEnum.PAGE_SETTINGS).then((settings: PageSettings) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Page Settings Received', data: settings });
    res.status(200).json(settings);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Page Settings', 'Page Settings Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const savePageSettings = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Saving Page Settings..' });
  // eslint-disable-next-line arrow-body-style
  return Promise.all(req.body.map((page) => databaseService.validateDocument(CollectionsEnum.PAGE_SETTINGS, page))).then((values) => {
    return databaseService.insert(req.session.selectedNode, CollectionsEnum.PAGE_SETTINGS, req.body).then((insertRes) => {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Page Settings Updated', data: insertRes });
      res.status(201).json(insertRes);
    }).catch((insertErrRes) => {
      const err = common.handleError(insertErrRes, 'Page Settings', 'Page Settings Update Error', req.session.selectedNode);
      throw new Error(JSON.stringify({ message: err.message, error: err.error }));
    });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Page Settings', 'Page Settings Validation Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
