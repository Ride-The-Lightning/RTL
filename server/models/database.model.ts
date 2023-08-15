export enum OfferFieldsEnum {
  BOLT12 = 'bolt12',
  AMOUNTMSAT = 'amountMSat',
  TITLE = 'title',
  ISSUER = 'issuer',
  DESCRIPTION = 'description'
}

export class Offer {

  constructor(
    public bolt12: string,
    public amountMSat: number,
    public title: string,
    public issuer?: string,
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
  COLUMN_SELECTION = 'columnSelection',
  COLUMN_SELECTION_SM = 'columnSelectionSM'
}

export class TableSetting {

  constructor(
    public tableId: string,
    public recordsPerPage?: number,
    public sortBy?: string,
    public sortOrder?: SortOrderEnum,
    public columnSelection?: any[]
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
    if (!table.hasOwnProperty(CollectionFieldsEnum.COLUMN_SELECTION_SM)) {
      errMsg = errMsg + 'Column Selection (Mobile Resolution) is mandatory.';
    }
    if (table[CollectionFieldsEnum.COLUMN_SELECTION_SM].length < 1) {
      errMsg = errMsg + 'Column Selection (Mobile Resolution) should have at least 1 field.';
    }
    if (table[CollectionFieldsEnum.COLUMN_SELECTION_SM].length > 3) {
      errMsg = errMsg + 'Column Selection (Mobile Resolution) should have maximum 3 fields.';
    }
    if (!table.hasOwnProperty(CollectionFieldsEnum.COLUMN_SELECTION)) {
      errMsg = errMsg + 'Column Selection (Desktop Resolution) is mandatory.';
    }
    if (table[CollectionFieldsEnum.COLUMN_SELECTION].length < 2) {
      errMsg = errMsg + 'Column Selection (Desktop Resolution) should have at least 2 fields.';
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

export const LNDCollection = [CollectionsEnum.PAGE_SETTINGS];
export const ECLCollection = [CollectionsEnum.PAGE_SETTINGS];
export const CLNCollection = [CollectionsEnum.PAGE_SETTINGS, CollectionsEnum.OFFERS];
