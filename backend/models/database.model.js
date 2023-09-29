export var OfferFieldsEnum;
(function (OfferFieldsEnum) {
    OfferFieldsEnum["BOLT12"] = "bolt12";
    OfferFieldsEnum["AMOUNTMSAT"] = "amountMSat";
    OfferFieldsEnum["TITLE"] = "title";
    OfferFieldsEnum["ISSUER"] = "issuer";
    OfferFieldsEnum["DESCRIPTION"] = "description";
})(OfferFieldsEnum || (OfferFieldsEnum = {}));
export class Offer {
    constructor(bolt12, amountMSat, title, issuer, description, lastUpdatedAt) {
        this.bolt12 = bolt12;
        this.amountMSat = amountMSat;
        this.title = title;
        this.issuer = issuer;
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
export var SortOrderEnum;
(function (SortOrderEnum) {
    SortOrderEnum["ASCENDING"] = "asc";
    SortOrderEnum["DESCENDING"] = "desc";
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
    TableSettingsFieldsEnum["COLUMN_SELECTION"] = "columnSelection";
    TableSettingsFieldsEnum["COLUMN_SELECTION_SM"] = "columnSelectionSM";
})(TableSettingsFieldsEnum || (TableSettingsFieldsEnum = {}));
export class TableSetting {
    constructor(tableId, recordsPerPage, sortBy, sortOrder, columnSelection) {
        this.tableId = tableId;
        this.recordsPerPage = recordsPerPage;
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.columnSelection = columnSelection;
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
        errorMessages = errorMessages + 'Page ID is mandatory.';
    }
    if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TABLES)) {
        errorMessages = errorMessages + 'Tables is mandatory.';
    }
    const tablesMessages = documentToValidate.tables.reduce((tableAcc, table, tableIdx) => {
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
export const CollectionFieldsEnum = { ...OfferFieldsEnum, ...PageSettingsFieldsEnum, ...TableSettingsFieldsEnum };
export const LNDCollection = [CollectionsEnum.PAGE_SETTINGS];
export const ECLCollection = [CollectionsEnum.PAGE_SETTINGS];
export const CLNCollection = [CollectionsEnum.PAGE_SETTINGS, CollectionsEnum.OFFERS];
export const ECL_UPDATED_DB = [
    {
        pageId: 'peers_channels',
        tables: [
            {
                tableId: 'open_channels',
                removed: ['buried', 'feeRatePerKw'],
                renamed: ['isFunder:isInitiator']
            },
            {
                tableId: 'pending_channels',
                removed: ['buried', 'feeRatePerKw'],
                renamed: ['isFunder:isInitiator']
            },
            {
                tableId: 'inactive_channels',
                removed: ['buried', 'feeRatePerKw'],
                renamed: ['isFunder:isInitiator']
            }
        ]
    }
];
