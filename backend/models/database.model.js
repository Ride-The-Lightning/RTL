export var OfferFieldsEnum;
(function (OfferFieldsEnum) {
    OfferFieldsEnum["BOLT12"] = "bolt12";
    OfferFieldsEnum["AMOUNTMSAT"] = "amountMSat";
    OfferFieldsEnum["TITLE"] = "title";
    OfferFieldsEnum["VENDOR"] = "vendor";
    OfferFieldsEnum["DESCRIPTION"] = "description";
})(OfferFieldsEnum || (OfferFieldsEnum = {}));
export class Offer {
    constructor(bolt12, amountMSat, title, vendor, description, lastUpdatedAt) {
        this.bolt12 = bolt12;
        this.amountMSat = amountMSat;
        this.title = title;
        this.vendor = vendor;
        this.description = description;
        this.lastUpdatedAt = lastUpdatedAt;
    }
}
export const validateOffer = (documentToValidate) => {
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
export var SortOrderEnum;
(function (SortOrderEnum) {
    SortOrderEnum["ASCENDING"] = "Ascending";
    SortOrderEnum["DESCENDING"] = "Descending";
})(SortOrderEnum || (SortOrderEnum = {}));
export var PageSettingsFieldsEnum;
(function (PageSettingsFieldsEnum) {
    PageSettingsFieldsEnum["PAYMENTS"] = "payments";
    PageSettingsFieldsEnum["INVOICES"] = "invoices";
    PageSettingsFieldsEnum["TABLES"] = "tables";
})(PageSettingsFieldsEnum || (PageSettingsFieldsEnum = {}));
export var TableSettingsFieldsEnum;
(function (TableSettingsFieldsEnum) {
    TableSettingsFieldsEnum["TABLE_ID"] = "tableId";
    TableSettingsFieldsEnum["RECORDS_PER_PAGE"] = "recordsPerPage";
    TableSettingsFieldsEnum["SORT_BY"] = "sortBy";
    TableSettingsFieldsEnum["SORT_ORDER"] = "sortOrder";
    TableSettingsFieldsEnum["SHOW_COLUMNS"] = "showColumns";
})(TableSettingsFieldsEnum || (TableSettingsFieldsEnum = {}));
export class TableSetting {
    constructor(tableId, recordsPerPage, sortBy, sortOrder, showColumns) {
        this.tableId = tableId;
        this.recordsPerPage = recordsPerPage;
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.showColumns = showColumns;
    }
}
export class PageSettings {
    constructor(pages) {
        this.pages = pages;
    }
}
export const validatePageSettings = (documentToValidate) => {
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
export var CollectionsEnum;
(function (CollectionsEnum) {
    CollectionsEnum["OFFERS"] = "Offers";
    CollectionsEnum["PAGE_SETTINGS"] = "PageSettings";
})(CollectionsEnum || (CollectionsEnum = {}));
export const CollectionFieldsEnum = Object.assign(Object.assign(Object.assign({}, OfferFieldsEnum), PageSettingsFieldsEnum), TableSettingsFieldsEnum);
