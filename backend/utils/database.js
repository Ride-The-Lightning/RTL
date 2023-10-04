import * as fs from 'fs';
import { join, sep } from 'path';
import { Common } from '../utils/common.js';
import { Logger } from '../utils/logger.js';
import { validateDocument, LNDCollection, ECLCollection, CLNCollection } from '../models/database.model.js';
export class DatabaseService {
    constructor() {
        this.common = Common;
        this.logger = Logger;
        this.dbDirectory = join(this.common.db_directory_path, 'database');
        this.nodeDatabase = {};
    }
    loadDatabase(session) {
        const { id, selectedNode } = session;
        try {
            if (!this.nodeDatabase[selectedNode.index]) {
                this.nodeDatabase[selectedNode.index] = { adapter: null, data: {} };
                this.nodeDatabase[selectedNode.index].adapter = new DatabaseAdapter(this.dbDirectory, selectedNode, id);
                this.fetchNodeData(selectedNode);
                this.logger.log({ selectedNode: selectedNode, level: 'DEBUG', fileName: 'Database', msg: 'Database Loaded', data: this.nodeDatabase[selectedNode.index].data });
            }
            else {
                this.nodeDatabase[selectedNode.index].adapter.insertSession(id);
            }
        }
        catch (err) {
            this.logger.log({ selectedNode: selectedNode, level: 'ERROR', fileName: 'Database', msg: 'Database Load Error', error: err });
        }
    }
    fetchNodeData(selectedNode) {
        switch (selectedNode.ln_implementation) {
            case 'CLN':
                for (const collectionName in CLNCollection) {
                    if (CLNCollection.hasOwnProperty(collectionName)) {
                        this.nodeDatabase[selectedNode.index].data[CLNCollection[collectionName]] = this.nodeDatabase[selectedNode.index].adapter.fetchData(CLNCollection[collectionName]);
                    }
                }
                break;
            case 'ECL':
                for (const collectionName in ECLCollection) {
                    if (ECLCollection.hasOwnProperty(collectionName)) {
                        this.nodeDatabase[selectedNode.index].data[ECLCollection[collectionName]] = this.nodeDatabase[selectedNode.index].adapter.fetchData(ECLCollection[collectionName]);
                    }
                }
                break;
            default:
                for (const collectionName in LNDCollection) {
                    if (LNDCollection.hasOwnProperty(collectionName)) {
                        this.nodeDatabase[selectedNode.index].data[LNDCollection[collectionName]] = this.nodeDatabase[selectedNode.index].adapter.fetchData(LNDCollection[collectionName]);
                    }
                }
                break;
        }
    }
    validateDocument(collectionName, newDocument) {
        return new Promise((resolve, reject) => {
            const validationRes = validateDocument(collectionName, newDocument);
            if (!validationRes.isValid) {
                reject(validationRes.error);
            }
            else {
                resolve(true);
            }
        });
    }
    insert(selectedNode, collectionName, newCollection) {
        return new Promise((resolve, reject) => {
            try {
                if (!selectedNode || !selectedNode.index) {
                    reject(new Error('Selected Node Config Not Found.'));
                }
                this.nodeDatabase[selectedNode.index].data[collectionName] = newCollection;
                this.saveDatabase(selectedNode, collectionName);
                resolve(this.nodeDatabase[selectedNode.index].data[collectionName]);
            }
            catch (errRes) {
                reject(errRes);
            }
        });
    }
    update(selectedNode, collectionName, updatedDocument, documentFieldName, documentFieldValue) {
        return new Promise((resolve, reject) => {
            try {
                if (!selectedNode || !selectedNode.index) {
                    reject(new Error('Selected Node Config Not Found.'));
                }
                let foundDocIdx = -1;
                let foundDoc = null;
                if (this.nodeDatabase[selectedNode.index].data[collectionName]) {
                    foundDocIdx = this.nodeDatabase[selectedNode.index].data[collectionName].findIndex((document) => document[documentFieldName] === documentFieldValue);
                    foundDoc = foundDocIdx > -1 ? JSON.parse(JSON.stringify(this.nodeDatabase[selectedNode.index].data[collectionName][foundDocIdx])) : null;
                }
                if (foundDocIdx > -1 && foundDoc) {
                    for (const docKey in updatedDocument) {
                        if (Object.prototype.hasOwnProperty.call(updatedDocument, docKey)) {
                            foundDoc[docKey] = updatedDocument[docKey];
                        }
                    }
                    updatedDocument = foundDoc;
                }
                if (foundDocIdx > -1) {
                    this.nodeDatabase[selectedNode.index].data[collectionName].splice(foundDocIdx, 1, updatedDocument);
                }
                else {
                    if (!this.nodeDatabase[selectedNode.index].data[collectionName]) {
                        this.nodeDatabase[selectedNode.index].data[collectionName] = [];
                    }
                    this.nodeDatabase[selectedNode.index].data[collectionName].push(updatedDocument);
                }
                this.saveDatabase(selectedNode, collectionName);
                resolve(updatedDocument);
            }
            catch (errRes) {
                reject(errRes);
            }
        });
    }
    find(selectedNode, collectionName, documentFieldName, documentFieldValue) {
        return new Promise((resolve, reject) => {
            try {
                if (!selectedNode || !selectedNode.index) {
                    reject(new Error('Selected Node Config Not Found.'));
                }
                if (documentFieldName && documentFieldValue) {
                    resolve(this.nodeDatabase[selectedNode.index].data[collectionName].find((document) => document[documentFieldName] === documentFieldValue));
                }
                else {
                    resolve(this.nodeDatabase[selectedNode.index].data[collectionName]);
                }
            }
            catch (errRes) {
                reject(errRes);
            }
        });
    }
    remove(selectedNode, collectionName, documentFieldName, documentFieldValue) {
        return new Promise((resolve, reject) => {
            try {
                if (!selectedNode || !selectedNode.index) {
                    reject(new Error('Selected Node Config Not Found.'));
                }
                const removeDocIdx = this.nodeDatabase[selectedNode.index].data[collectionName].findIndex((document) => document[documentFieldName] === documentFieldValue);
                if (removeDocIdx > -1) {
                    this.nodeDatabase[selectedNode.index].data[collectionName].splice(removeDocIdx, 1);
                }
                else {
                    reject(new Error('Unable to delete, document not found.'));
                }
                this.saveDatabase(selectedNode, collectionName);
                resolve(documentFieldValue);
            }
            catch (errRes) {
                reject(errRes);
            }
        });
    }
    saveDatabase(selectedNode, collectionName) {
        const nodeIndex = +selectedNode.index;
        try {
            if (nodeIndex < 1) {
                return true;
            }
            const selNode = this.nodeDatabase[nodeIndex] && this.nodeDatabase[nodeIndex].adapter && this.nodeDatabase[nodeIndex].adapter.selNode ? this.nodeDatabase[nodeIndex].adapter.selNode : null;
            if (!this.nodeDatabase[nodeIndex]) {
                this.logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Database', msg: 'Database Save Error: Selected Node Setup Not Found.' });
                throw new Error('Database Save Error: Selected Node Setup Not Found.');
            }
            this.nodeDatabase[nodeIndex].adapter.saveData(collectionName, this.nodeDatabase[selectedNode.index].data[collectionName]);
            this.logger.log({ selectedNode: this.nodeDatabase[nodeIndex].adapter.selNode, level: 'INFO', fileName: 'Database', msg: 'Database Collection ' + collectionName + ' Saved' });
            return true;
        }
        catch (err) {
            const selNode = this.nodeDatabase[nodeIndex] && this.nodeDatabase[nodeIndex].adapter && this.nodeDatabase[nodeIndex].adapter.selNode ? this.nodeDatabase[nodeIndex].adapter.selNode : null;
            this.logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Database', msg: 'Database Save Error', error: err });
            throw err;
        }
    }
    unloadDatabase(nodeIndex, sessionID) {
        if (nodeIndex > 0) {
            if (this.nodeDatabase[nodeIndex] && this.nodeDatabase[nodeIndex].adapter) {
                this.nodeDatabase[nodeIndex].adapter.removeSession(sessionID);
                if (this.nodeDatabase[nodeIndex].adapter.userSessions && this.nodeDatabase[nodeIndex].adapter.userSessions.length <= 0) {
                    delete this.nodeDatabase[nodeIndex];
                }
            }
        }
    }
}
export class DatabaseAdapter {
    constructor(dbDirectoryPath, selNode = null, id = '') {
        this.dbDirectoryPath = dbDirectoryPath;
        this.selNode = selNode;
        this.id = id;
        this.logger = Logger;
        this.common = Common;
        this.dbFilePath = '';
        this.userSessions = [];
        this.dbFilePath = dbDirectoryPath + sep + 'node-' + selNode.index;
        // For backward compatibility Start
        const oldFilePath = dbDirectoryPath + sep + 'rtldb-node-' + selNode.index + '.json';
        if (selNode.ln_implementation === 'CLN' && fs.existsSync(oldFilePath)) {
            this.renameOldDB(oldFilePath, selNode);
        }
        // For backward compatibility End
        this.insertSession(id);
    }
    renameOldDB(oldFilePath, selNode = null) {
        const newFilePath = this.dbFilePath + sep + 'rtldb-' + selNode.ln_implementation + '-Offers.json';
        try {
            this.common.createDirectory(this.dbFilePath);
            const oldOffers = JSON.parse(fs.readFileSync(oldFilePath, 'utf-8'));
            fs.writeFileSync(oldFilePath, JSON.stringify(oldOffers.Offers ? oldOffers.Offers : [], null, 2));
            fs.renameSync(oldFilePath, newFilePath);
        }
        catch (err) {
            this.logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Database', msg: 'Rename Old Database Error', error: err });
        }
    }
    fetchData(collectionName) {
        try {
            if (!fs.existsSync(this.dbFilePath)) {
                this.common.createDirectory(this.dbFilePath);
            }
        }
        catch (err) {
            throw new Error(JSON.stringify(err));
        }
        const collectionFilePath = this.dbFilePath + sep + 'rtldb-' + this.selNode.ln_implementation + '-' + collectionName + '.json';
        try {
            if (!fs.existsSync(collectionFilePath)) {
                fs.writeFileSync(collectionFilePath, '[]');
            }
        }
        catch (err) {
            throw new Error(JSON.stringify(err));
        }
        try {
            const otherFiles = fs.readdirSync(this.dbFilePath);
            otherFiles.forEach((oFileName) => {
                let collectionValid = false;
                switch (this.selNode.ln_implementation) {
                    case 'CLN':
                        collectionValid = CLNCollection.reduce((acc, collection) => acc || oFileName === ('rtldb-' + this.selNode.ln_implementation + '-' + collection + '.json'), false);
                        break;
                    case 'ECL':
                        collectionValid = ECLCollection.reduce((acc, collection) => acc || oFileName === ('rtldb-' + this.selNode.ln_implementation + '-' + collection + '.json'), false);
                        break;
                    default:
                        collectionValid = LNDCollection.reduce((acc, collection) => acc || oFileName === ('rtldb-' + this.selNode.ln_implementation + '-' + collection + '.json'), false);
                        break;
                }
                if (oFileName.endsWith('.json') && !collectionValid) {
                    fs.renameSync(this.dbFilePath + sep + oFileName, this.dbFilePath + sep + oFileName + '.tmp');
                }
            });
        }
        catch (err) {
            this.logger.log({ selectedNode: this.selNode, level: 'ERROR', fileName: 'Database', msg: 'Rename Other Implementation DB Error', error: err });
        }
        try {
            const dataFromFile = fs.readFileSync(collectionFilePath, 'utf-8');
            const dataObj = !dataFromFile ? null : JSON.parse(dataFromFile);
            return dataObj;
        }
        catch (err) {
            throw new Error(JSON.stringify(err));
        }
    }
    getSelNode() {
        return this.selNode;
    }
    saveData(collectionName, collectionData) {
        try {
            if (collectionData) {
                const collectionFilePath = this.dbFilePath + sep + 'rtldb-' + this.selNode.ln_implementation + '-' + collectionName + '.json';
                const tempFile = collectionFilePath + '.tmp';
                fs.writeFileSync(tempFile, JSON.stringify(collectionData, null, 2));
                fs.renameSync(tempFile, collectionFilePath);
            }
            return true;
        }
        catch (err) {
            throw err;
        }
    }
    insertSession(id = '') {
        if (!this.userSessions.includes(id)) {
            this.userSessions.push(id);
        }
    }
    removeSession(sessionID = '') {
        this.userSessions.splice(this.userSessions.findIndex((sId) => sId === sessionID), 1);
    }
}
export const Database = new DatabaseService();
