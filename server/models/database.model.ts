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
  let errorMessages = '';
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.PAGE_ID)) {
    errorMessages = errorMessages + CollectionFieldsEnum.PAGE_ID + ' is mandatory.';
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TABLES)) {
    errorMessages = errorMessages + CollectionFieldsEnum.TABLES + ' is mandatory.';
  }
  const tablesMessages = documentToValidate.tables.reduce((tableAcc, table: TableSetting, tableIdx) => {
    let errMsg = '';
    if (!table.hasOwnProperty(CollectionFieldsEnum.TABLE_ID)) {
      errMsg = errMsg + CollectionFieldsEnum.TABLE_ID + ' is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SORT_BY)) {
      errMsg = errMsg + CollectionFieldsEnum.SORT_BY + ' is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SORT_ORDER)) {
      errMsg = errMsg + CollectionFieldsEnum.SORT_ORDER + ' is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.RECORDS_PER_PAGE)) {
      errMsg = errMsg + CollectionFieldsEnum.RECORDS_PER_PAGE + ' is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SHOW_COLUMNS)) {
      errMsg = errMsg + CollectionFieldsEnum.SHOW_COLUMNS + ' is mandatory.';
    }
    if (table[CollectionFieldsEnum.SHOW_COLUMNS].length < 2) {
      errMsg = errMsg + CollectionFieldsEnum.SHOW_COLUMNS + ' should have at least 2 fields.';
    }
    if (errMsg.trim() !== '') {
      tableAcc.push({ table: (table.hasOwnProperty(CollectionFieldsEnum.TABLE_ID) ? table[CollectionFieldsEnum.TABLE_ID] : (tableIdx + 1)), message: errMsg });
    }
    return tableAcc;
  }, []);
  if (errorMessages.trim() === '' && tablesMessages.length && tablesMessages.length === 0) {
    return ({ isValid: true });
  } else {
    const errObj = { page: (documentToValidate.hasOwnProperty(CollectionFieldsEnum.PAGE_ID) ? documentToValidate[CollectionFieldsEnum.PAGE_ID] : 'Unknown') };
    if (errorMessages.trim() !== '') {
      errObj['message'] = errorMessages;
    }
    if (tablesMessages.length && tablesMessages.length > 0) {
      errObj['tables'] = tablesMessages;
    }
    return ({ isValid: false, error: JSON.stringify(errObj) });
  }
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
