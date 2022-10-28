import * as fs from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import { Common, CommonService } from '../utils/common.js';
import { Logger, LoggerService } from '../utils/logger.js';
import { Collections, CollectionsEnum, validateDocument, LNDCollection, ECLCollection, CLNCollection } from '../models/database.model.js';
import { CommonSelectedNode } from '../models/config.model.js';

export class DatabaseService {

  public common: CommonService = Common;
  public logger: LoggerService = Logger;
  public dbDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'database');
  public nodeDatabase: { id?: { adapter: DatabaseAdapter, data: Collections } } = {};

  constructor() { }

  loadDatabase(session: any) {
    const { id, selectedNode } = session;
    try {
      if (!this.nodeDatabase[selectedNode.index]) {
        this.nodeDatabase[selectedNode.index] = { adapter: null, data: {} };
        this.nodeDatabase[selectedNode.index].adapter = new DatabaseAdapter(this.dbDirectory, selectedNode, id);
        this.fetchNodeData(selectedNode);
        this.logger.log({ selectedNode: selectedNode, level: 'DEBUG', fileName: 'Database', msg: 'Database Loaded', data: this.nodeDatabase[selectedNode.index].data });
      } else {
        this.nodeDatabase[selectedNode.index].adapter.insertSession(id);
      }
    } catch (err) {
      this.logger.log({ selectedNode: selectedNode, level: 'ERROR', fileName: 'Database', msg: 'Database Load Error', error: err });
    }
  }

  fetchNodeData(selectedNode: CommonSelectedNode) {
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
      } else {
        resolve(true);
      }
    });
  }

  insert(selectedNode: CommonSelectedNode, collectionName: CollectionsEnum, newDocument: any) {
    return new Promise((resolve, reject) => {
      try {
        if (!selectedNode || !selectedNode.index) {
          reject(new Error('Selected Node Config Not Found.'));
        }
        this.nodeDatabase[selectedNode.index].data[collectionName].push(newDocument);
        this.saveDatabase(+selectedNode.index);
        resolve(newDocument);
      } catch (errRes) {
        reject(errRes);
      }
    });
  }

  update(selectedNode: CommonSelectedNode, collectionName: CollectionsEnum, updatedDocument: any, documentFieldName: string, documentFieldValue: string) {
    return new Promise((resolve, reject) => {
      try {
        if (!selectedNode || !selectedNode.index) {
          reject(new Error('Selected Node Config Not Found.'));
        }
        let foundDocIdx = -1;
        let foundDoc = null;
        if (this.nodeDatabase[selectedNode.index].data[collectionName]) {
          foundDocIdx = this.nodeDatabase[selectedNode.index].data[collectionName].findIndex((document: any) => document[documentFieldName] === documentFieldValue);
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
        } else {
          if (!this.nodeDatabase[selectedNode.index].data[collectionName]) {
            this.nodeDatabase[selectedNode.index].data[collectionName] = [];
          }
          this.nodeDatabase[selectedNode.index].data[collectionName].push(updatedDocument);
        }
        this.saveDatabase(+selectedNode.index);
        resolve(updatedDocument);
      } catch (errRes) {
        reject(errRes);
      }
    });
  }

  find(selectedNode: CommonSelectedNode, collectionName: CollectionsEnum, documentFieldName?: string, documentFieldValue?: string) {
    return new Promise((resolve, reject) => {
      try {
        if (!selectedNode || !selectedNode.index) {
          reject(new Error('Selected Node Config Not Found.'));
        }
        if (documentFieldName && documentFieldValue) {
          resolve(this.nodeDatabase[selectedNode.index].data[collectionName].find((document: any) => document[documentFieldName] === documentFieldValue));
        } else {
          resolve(this.nodeDatabase[selectedNode.index].data[collectionName]);
        }
      } catch (errRes) {
        reject(errRes);
      }
    });
  }

  remove(selectedNode: CommonSelectedNode, collectionName: CollectionsEnum, documentFieldName: string, documentFieldValue: string) {
    return new Promise((resolve, reject) => {
      try {
        if (!selectedNode || !selectedNode.index) {
          reject(new Error('Selected Node Config Not Found.'));
        }
        const removeDocIdx = this.nodeDatabase[selectedNode.index].data[collectionName].findIndex((document) => document[documentFieldName] === documentFieldValue);
        if (removeDocIdx > -1) {
          this.nodeDatabase[selectedNode.index].data[collectionName].splice(removeDocIdx, 1);
        } else {
          reject(new Error('Unable to delete, document not found.'));
        }
        this.saveDatabase(+selectedNode.index);
        resolve(documentFieldValue);
      } catch (errRes) {
        reject(errRes);
      }
    });
  }

  saveDatabase(nodeIndex: number) {
    try {
      if (+nodeIndex < 1) {
        return true;
      }
      const selNode = this.nodeDatabase[nodeIndex] && this.nodeDatabase[nodeIndex].adapter && this.nodeDatabase[nodeIndex].adapter.selNode ? this.nodeDatabase[nodeIndex].adapter.selNode : null;
      if (!this.nodeDatabase[nodeIndex]) {
        this.logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Database', msg: 'Database Save Error: Selected Node Setup Not Found.' });
        throw new Error('Database Save Error: Selected Node Setup Not Found.');
      }
      this.nodeDatabase[nodeIndex].adapter.saveData(this.nodeDatabase[nodeIndex].data);
      this.logger.log({ selectedNode: this.nodeDatabase[nodeIndex].adapter.selNode, level: 'INFO', fileName: 'Database', msg: 'Database Saved' });
      return true;
    } catch (err) {
      const selNode = this.nodeDatabase[nodeIndex] && this.nodeDatabase[nodeIndex].adapter && this.nodeDatabase[nodeIndex].adapter.selNode ? this.nodeDatabase[nodeIndex].adapter.selNode : null;
      this.logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Database', msg: 'Database Save Error', error: err });
      return new Error(err);
    }
  }

  unloadDatabase(nodeIndex: number, sessionID: string) {
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

  private logger: LoggerService = Logger;
  private common: CommonService = Common;
  private dbFilePath = '';
  private userSessions = [];

  constructor(public dbDirectoryPath: string, private selNode: CommonSelectedNode = null, private id: string = '') {
    this.dbFilePath = dbDirectoryPath + sep + 'node-' + selNode.index;
    const oldFileName = dbDirectoryPath + sep + 'rtldb-node-' + selNode.index + '.json';
    if (selNode.ln_implementation === 'CLN' && fs.existsSync(oldFileName)) { this.renameOldDB(oldFileName, selNode); }
    this.insertSession(id);
  }

  renameOldDB(oldFileName: string, selNode: CommonSelectedNode = null) {
    const newFileName = this.dbFilePath + sep + 'rtldb-' + selNode.ln_implementation + '-Offers.json';
    try {
      this.common.createDirectory(this.dbFilePath);
      fs.renameSync(oldFileName, newFileName);
    } catch (err) {
      this.logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Database', msg: 'Rename Old Database Error', error: err });
    }
  }

  fetchData(collectionName: string) {
    try {
      if (!fs.existsSync(this.dbFilePath)) {
        fs.mkdirSync(this.dbFilePath);
      }
    } catch (err) {
      return new Error('Unable to Create Directory Error ' + JSON.stringify(err));
    }
    const collectionFileName = this.dbFilePath + sep + 'rtldb-' + this.selNode.ln_implementation + '-' + collectionName + '.json';
    try {
      if (!fs.existsSync(collectionFileName)) {
        fs.writeFileSync(collectionFileName, '{}');
      }
    } catch (err) {
      return new Error('Unable to Create Database File Error ' + JSON.stringify(err));
    }
    try {
      const dataFromFile = fs.readFileSync(collectionFileName, 'utf-8');
      const dataObj = !dataFromFile ? null : (<Collections>JSON.parse(dataFromFile));
      return dataObj;
    } catch (err) {
      return new Error('Database Read Error ' + JSON.stringify(err));
    }
  }

  getSelNode() {
    return this.selNode;
  }

  saveData(data: any) {
    try {
      if (data) {
        for (const collectionName in data) {
          if (data.hasOwnProperty(collectionName)) {
            const collectionFileName = this.dbFilePath + sep + 'rtldb-' + this.selNode.ln_implementation + '-' + collectionName + '.json';
            const tempFile = collectionFileName + '.tmp';
            fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
            fs.renameSync(tempFile, collectionFileName);
          }
        }
      }
      return true;
    } catch (err) {
      return new Error('Database Write Error ' + JSON.stringify(err));
    }
  }

  insertSession(id: string = '') {
    if (!this.userSessions.includes(id)) {
      this.userSessions.push(id);
    }
  }

  removeSession(sessionID: string = '') {
    this.userSessions.splice(this.userSessions.findIndex((sId) => sId === sessionID), 1);
  }

}

export const Database = new DatabaseService();
