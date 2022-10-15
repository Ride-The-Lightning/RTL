export enum OfferFieldsEnum {
  BOLT12 = 'bolt12',
  AMOUNTMSAT = 'amountMSat',
  TITLE = 'title',
  VENDOR = 'vendor',
  DESCRIPTION = 'description'
}

export class Offer {

  constructor(
    public bolt12: string,
    public amountMSat: number,
    public title: string,
    public vendor?: string,
    public description?: string,
    public lastUpdatedAt?: number
  ) { }

}

export const validateDocument = (collectionName: CollectionsEnum, documentToValidate: any): any => {
  switch (collectionName) {
    case CollectionsEnum.OFFERS:
      return validateOffer(documentToValidate);
    case CollectionsEnum.PAGE_SETTINGS:
      return validatePageSettings(documentToValidate);
    default:
      return ({ isValid: false, error: 'Collection does not exist' });
  }
};

export const validateOffer = (documentToValidate): any => {
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.BOLT12)) {
    return ({ isValid: false, error: CollectionFieldsEnum.BOLT12 + ' is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.AMOUNTMSAT)) {
    return ({ isValid: false, error: CollectionFieldsEnum.AMOUNTMSAT + ' is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TITLE)) {
    return ({ isValid: false, error: CollectionFieldsEnum.TITLE + ' is mandatory.' });
  }
  if ((typeof documentToValidate[CollectionFieldsEnum.AMOUNTMSAT] !== 'number')) {
    return ({ isValid: false, error: CollectionFieldsEnum.AMOUNTMSAT + ' should be a number.' });
  }
  return ({ isValid: true });
};

export enum SortOrderEnum {
  ASCENDING = 'Ascending',
  DESCENDING = 'Descending'
}

export enum PageSettingsFieldsEnum {
  PAGE_ID = 'pageId',
  TABLES = 'tables'
}

export enum TableSettingsFieldsEnum {
  TABLE_ID = 'tableId',
  RECORDS_PER_PAGE = 'recordsPerPage',
  SORT_BY = 'sortBy',
  SORT_ORDER = 'sortOrder',
  SHOW_COLUMNS = 'showColumns'
}

export class TableSetting {

  constructor(
    public tableId: string,
    public recordsPerPage?: number,
    public sortBy?: string,
    public sortOrder?: SortOrderEnum,
    public showColumns?: any[]
  ) { }

}

export class PageSettings {

  constructor(
    public pageId: string,
    public tables: TableSetting[]
  ) { }

}

export const validatePageSettings = (documentToValidate): any => {
  const errorMessages = documentToValidate.reduce((docAcc, doc: PageSettings, pageIdx) => {
    let newDocMsgs = '';
    if (!doc.hasOwnProperty(CollectionFieldsEnum.PAGE_ID)) {
      newDocMsgs = newDocMsgs + ' ' + CollectionFieldsEnum.PAGE_ID + ' is mandatory.';
    }
    if (!doc.hasOwnProperty(CollectionFieldsEnum.TABLES)) {
      newDocMsgs = newDocMsgs + ' ' + CollectionFieldsEnum.TABLES + ' is mandatory.';
    }
    newDocMsgs = newDocMsgs + ' ' + doc.tables.reduce((tableAcc, table: TableSetting, tableIdx) => {
      if (!table.hasOwnProperty(CollectionFieldsEnum.TABLE_ID)) {
        tableAcc = tableAcc + ' ' + CollectionFieldsEnum.TABLE_ID + ' is mandatory.';
      }
      if (!table.hasOwnProperty(CollectionFieldsEnum.SORT_BY)) {
        tableAcc = tableAcc + ' ' + CollectionFieldsEnum.SORT_BY + ' is mandatory.';
      }
      if (!table.hasOwnProperty(CollectionFieldsEnum.SORT_ORDER)) {
        tableAcc = tableAcc + ' ' + CollectionFieldsEnum.SORT_ORDER + ' is mandatory.';
      }
      if (!table.hasOwnProperty(CollectionFieldsEnum.RECORDS_PER_PAGE)) {
        tableAcc = tableAcc + ' ' + CollectionFieldsEnum.RECORDS_PER_PAGE + ' is mandatory.';
      }
      if (!table.hasOwnProperty(CollectionFieldsEnum.SHOW_COLUMNS)) {
        tableAcc = tableAcc + ' ' + CollectionFieldsEnum.SHOW_COLUMNS + ' is mandatory.';
      }
      if (table[CollectionFieldsEnum.SHOW_COLUMNS].length < 2) {
        tableAcc = tableAcc + ' ' + CollectionFieldsEnum.SHOW_COLUMNS + ' should have at least 2 fields.';
      }
      tableAcc = tableAcc.trim() !== '' ? ('table ' + (table.hasOwnProperty(CollectionFieldsEnum.TABLE_ID) ? table[CollectionFieldsEnum.TABLE_ID] : (tableIdx + 1)) + tableAcc) : '';
      return tableAcc;
    }, '');
    if (newDocMsgs.trim() !== '') {
      docAcc = docAcc + '\nFor page ' + (doc.hasOwnProperty(CollectionFieldsEnum.PAGE_ID) ? doc[CollectionFieldsEnum.PAGE_ID] : (pageIdx + 1)) + newDocMsgs;
    }
    return docAcc;
  }, '');
  if (errorMessages !== '') {
    return ({ isValid: false, error: errorMessages });
  }
  return ({ isValid: true });
};

export enum CollectionsEnum {
  OFFERS = 'Offers',
  PAGE_SETTINGS = 'PageSettings'
}

export type Collections = {
  Offers: Offer[];
  PageSettings: PageSettings[];
}

export const CollectionFieldsEnum = { ...OfferFieldsEnum, ...PageSettingsFieldsEnum, ...TableSettingsFieldsEnum };
