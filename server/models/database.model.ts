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
    return ({ isValid: false, error: 'Bolt12 is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.AMOUNTMSAT)) {
    return ({ isValid: false, error: 'Amount mSat is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TITLE)) {
    return ({ isValid: false, error: 'Title is mandatory.' });
  }
  if ((typeof documentToValidate[CollectionFieldsEnum.AMOUNTMSAT] !== 'number')) {
    return ({ isValid: false, error: 'Amount mSat should be a number.' });
  }
  return ({ isValid: true });
};

export enum SortOrderEnum {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
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
  SHOW_COLUMNS = 'showColumns',
  SHOW_COLUMNS_SM = 'showColumnsSM'
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
    errorMessages = errorMessages + 'Page ID is mandatory.';
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TABLES)) {
    errorMessages = errorMessages + 'Tables is mandatory.';
  }
  const tablesMessages = documentToValidate.tables.reduce((tableAcc, table: TableSetting, tableIdx) => {
    let errMsg = '';
    if (!table.hasOwnProperty(CollectionFieldsEnum.TABLE_ID)) {
      errMsg = errMsg + 'Table ID is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SORT_BY)) {
      errMsg = errMsg + 'Sort By is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SORT_ORDER)) {
      errMsg = errMsg + 'Sort Order is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.RECORDS_PER_PAGE)) {
      errMsg = errMsg + 'Records/Page is mandatory.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SHOW_COLUMNS_SM)) {
      errMsg = errMsg + 'Show Columns Small Screen is mandatory.';
    }
    if (table[CollectionFieldsEnum.SHOW_COLUMNS_SM].length < 1) {
      errMsg = errMsg + 'Show Columns Small Screen should have at least 1 field.';
    }
    if (table[CollectionFieldsEnum.SHOW_COLUMNS_SM].length > 2) {
      errMsg = errMsg + 'Show Columns Small Screen should have maximum 2 fields.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.SHOW_COLUMNS)) {
      errMsg = errMsg + 'Show Columns is mandatory.';
    }
    if (table[CollectionFieldsEnum.SHOW_COLUMNS].length < 2) {
      errMsg = errMsg + 'Show Columns should have at least 2 fields.';
    }
    if (errMsg.trim() !== '') {
      tableAcc.push({ table: (table.hasOwnProperty(CollectionFieldsEnum.TABLE_ID) ? table[CollectionFieldsEnum.TABLE_ID] : (tableIdx + 1)), message: errMsg });
    }
    return tableAcc;
  }, []);
  if (errorMessages.trim() === '' && tablesMessages.length === 0) {
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
