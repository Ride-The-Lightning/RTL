import * as fs from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import { Common, CommonService } from '../utils/common.js';
import { Logger, LoggerService } from '../utils/logger.js';
import { Collections, CollectionsEnum, validateOffer } from '../models/database.model.js';
import { CommonSelectedNode } from '../models/config.model.js';

export class DatabaseService {

  public common: CommonService = Common;
  public logger: LoggerService = Logger;
  public dbDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'database');
  public nodeDatabase: { id?: { adapter: DatabaseAdapter, data: Collections } } = {};

  constructor() { }

  loadDatabase(selectedNode: CommonSelectedNode) {
    try {
      if (!this.nodeDatabase[selectedNode.index]) {
        this.nodeDatabase[selectedNode.index] = { adapter: null, data: null };
      }
      this.nodeDatabase[selectedNode.index].adapter = new DatabaseAdapter(this.dbDirectory, 'rtldb', selectedNode);
      this.nodeDatabase[selectedNode.index].data = this.nodeDatabase[selectedNode.index].adapter.fetchData();
    } catch (err) {
      this.logger.log({ selectedNode: selectedNode, level: 'ERROR', fileName: 'Database', msg: 'Database Load Error', error: err });
    }
  }

  create(selectedNode: CommonSelectedNode, collectionName: CollectionsEnum, newDocument: any) {
    return new Promise((resolve, reject) => {
      try {
        if (!selectedNode || !selectedNode.index) {
          reject(new Error('Selected Node Config Not Found.'));
        }
        const validationRes = this.validateDocument(CollectionsEnum.OFFERS, newDocument);
        if (!validationRes.isValid) {
          reject(validationRes.error);
        } else {
          this.nodeDatabase[selectedNode.index].data[collectionName].push(newDocument);
          this.saveDatabase(+selectedNode.index);
          resolve(newDocument);
        }
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
        const validationRes = this.validateDocument(CollectionsEnum.OFFERS, updatedDocument);
        if (!validationRes.isValid) {
          reject(validationRes.error);
        } else {
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
        }
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

  destroy(selectedNode: CommonSelectedNode, collectionName: CollectionsEnum, documentFieldName: string, documentFieldValue: string) {
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

  validateDocument(collectionName: CollectionsEnum, documentToValidate: any) {
    switch (collectionName) {
      case CollectionsEnum.OFFERS:
        return validateOffer(documentToValidate);

      default:
        return ({ isValid: false, error: 'Collection does not exist' });
    }
  }

  saveDatabase(nodeIndex: number) {
    try {
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

  unloadDatabase(nodeIndex: number) {
    this.saveDatabase(nodeIndex);
    this.nodeDatabase[nodeIndex] = null;
  }

}

export class DatabaseAdapter {

  private dbFile = '';

  constructor(public dbDirectoryPath: string, public fileName: string, private selNode: CommonSelectedNode = null) {
    this.dbFile = dbDirectoryPath + sep + fileName + '-node-' + selNode.index + '.json';
  }

  fetchData() {
    try {
      if (!fs.existsSync(this.dbDirectoryPath)) {
        fs.mkdirSync(this.dbDirectoryPath);
      }
    } catch (err) {
      return new Error('Unable to Create Directory Error ' + JSON.stringify(err));
    }
    try {
      if (!fs.existsSync(this.dbFile)) {
        fs.writeFileSync(this.dbFile, '{}');
      }
    } catch (err) {
      return new Error('Unable to Create Database File Error ' + JSON.stringify(err));
    }
    try {
      const dataFromFile = fs.readFileSync(this.dbFile, 'utf-8');
      return !dataFromFile ? null : (<Collections>JSON.parse(dataFromFile));
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
        const tempFile = this.dbFile + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, this.dbFile);
      }
      return true;
    } catch (err) {
      return new Error('Database Write Error ' + JSON.stringify(err));
    }
  }

}

export const Database = new DatabaseService();
