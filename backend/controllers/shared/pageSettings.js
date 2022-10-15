import { Database } from '../../utils/database.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { CollectionFieldsEnum, CollectionsEnum } from '../../models/database.model.js';
const logger = Logger;
const common = Common;
const databaseService = Database;
export const getPageSettings = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Getting Page Settings..' });
    databaseService.find(req.session.selectedNode, CollectionsEnum.PAGE_SETTINGS).then((settings) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Page Settings Received', data: settings });
        res.status(200).json(settings);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Page Settings', 'Page Settings Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const savePageSettings = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Page Settings', msg: 'Saving Page Settings..' });
    return Promise.all(req.body.map((page) => databaseService.update(req.session.selectedNode, CollectionsEnum.PAGE_SETTINGS, page, CollectionFieldsEnum.PAGE_ID, page.pageId))).
        then((values) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'PayRequest', msg: 'Payment List Decoded', data: values });
        res.status(201).json(values);
    }).
        catch((errRes) => {
        const err = common.handleError(errRes, 'Page Settings', 'Page Settings Update Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
