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
export const validateDocument = (collectionName, documentToValidate) => {
    switch (collectionName) {
        case CollectionsEnum.OFFERS:
            return validateOffer(documentToValidate);
        case CollectionsEnum.PAGE_SETTINGS:
            return validatePageSettings(documentToValidate);
        default:
            return ({ isValid: false, error: 'Collection does not exist' });
    }
};
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
    PageSettingsFieldsEnum["PAGE_ID"] = "pageId";
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
    constructor(pageId, tables) {
        this.pageId = pageId;
        this.tables = tables;
    }
}
export const validatePageSettings = (documentToValidate) => {
    let errorMessages = '';
    if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.PAGE_ID)) {
        errorMessages = errorMessages + CollectionFieldsEnum.PAGE_ID + ' is mandatory.';
    }
    if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TABLES)) {
        errorMessages = errorMessages + CollectionFieldsEnum.TABLES + ' is mandatory.';
    }
    const tablesMessages = documentToValidate.tables.reduce((tableAcc, table, tableIdx) => {
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
    }
    else {
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
export var CollectionsEnum;
(function (CollectionsEnum) {
    CollectionsEnum["OFFERS"] = "Offers";
    CollectionsEnum["PAGE_SETTINGS"] = "PageSettings";
})(CollectionsEnum || (CollectionsEnum = {}));
export const CollectionFieldsEnum = Object.assign(Object.assign(Object.assign({}, OfferFieldsEnum), PageSettingsFieldsEnum), TableSettingsFieldsEnum);
