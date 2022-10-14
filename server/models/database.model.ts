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
  PAYMENTS = 'payments',
  INVOICES = 'invoices',
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
    public pages: {
      payments: { tables: TableSetting[] };
      invoices: { tables: TableSetting[] };
    }
  ) { }

}

export const validatePageSettings = (documentToValidate): any => {
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.PAYMENTS)) {
    return ({ isValid: false, error: CollectionFieldsEnum.PAYMENTS + ' is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.INVOICES)) {
    return ({ isValid: false, error: CollectionFieldsEnum.INVOICES + ' is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TABLES)) {
    return ({ isValid: false, error: CollectionFieldsEnum.TABLES + ' is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TABLE_ID)) {
    return ({ isValid: false, error: CollectionFieldsEnum.TABLE_ID + ' is mandatory.' });
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.SHOW_COLUMNS)) {
    return ({ isValid: false, error: CollectionFieldsEnum.SHOW_COLUMNS + ' is mandatory.' });
  }
  if (documentToValidate[CollectionFieldsEnum.SHOW_COLUMNS].length < 3) {
    return ({ isValid: false, error: CollectionFieldsEnum.SHOW_COLUMNS + ' should have at least 2 fields.' });
  }
  return ({ isValid: true });
};

export enum CollectionsEnum {
  OFFERS = 'Offers',
  PAGE_SETTINGS = 'PageSettings'
}

export type Collections = {
  Offers: Offer[];
  PageSettings: PageSettings;
}

export const CollectionFieldsEnum = { ...OfferFieldsEnum, ...PageSettingsFieldsEnum, ...TableSettingsFieldsEnum };
