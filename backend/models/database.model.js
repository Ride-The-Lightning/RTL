export var CollectionsEnum;
(function (CollectionsEnum) {
    CollectionsEnum["OFFERS"] = "Offers";
})(CollectionsEnum || (CollectionsEnum = {}));
export var OfferFieldsEnum;
(function (OfferFieldsEnum) {
    OfferFieldsEnum["BOLT12"] = "bolt12";
    OfferFieldsEnum["AMOUNTMSAT"] = "amountmSat";
    OfferFieldsEnum["TITLE"] = "title";
    OfferFieldsEnum["VENDOR"] = "vendor";
    OfferFieldsEnum["DESCRIPTION"] = "description";
})(OfferFieldsEnum || (OfferFieldsEnum = {}));
export const CollectionFieldsEnum = Object.assign({}, OfferFieldsEnum);
export class Offer {
    constructor(bolt12, amountmSat, title, vendor, description, lastUpdatedAt) {
        this.bolt12 = bolt12;
        this.amountmSat = amountmSat;
        this.title = title;
        this.vendor = vendor;
        this.description = description;
        this.lastUpdatedAt = lastUpdatedAt;
    }
}
export const validateOffer = (documentToValidate) => {
    if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.BOLT12)) {
        return ({ isValid: false, error: CollectionFieldsEnum.BOLT12 + 'is mandatory.' });
    }
    if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.AMOUNTMSAT)) {
        return ({ isValid: false, error: CollectionFieldsEnum.AMOUNTMSAT + 'is mandatory.' });
    }
    if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TITLE)) {
        return ({ isValid: false, error: CollectionFieldsEnum.TITLE + 'is mandatory.' });
    }
    if ((typeof documentToValidate[CollectionFieldsEnum.AMOUNTMSAT] !== 'number')) {
        return ({ isValid: false, error: CollectionFieldsEnum.AMOUNTMSAT + 'should be a number.' });
    }
    return ({ isValid: true });
};
