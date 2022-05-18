export enum CollectionsEnum {
  OFFERS = 'Offers'
}

export type Collections = {
  Offers: Offer[];
};

export enum OfferFieldsEnum {
  BOLT12 = 'bolt12',
  AMOUNTMSAT = 'amountmSat',
  TITLE = 'title',
  VENDOR = 'vendor',
  DESCRIPTION = 'description'
}

export const CollectionFieldsEnum = { ...OfferFieldsEnum };

export class Offer {
  constructor(
    public bolt12: string,
    public amountmSat: number,
    public title: string,
    public vendor?: string,
    public description?: string,
    public lastUpdatedAt?: number
  ) {}
}

export const validateOffer = (documentToValidate): any => {
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.BOLT12)) {
    return { isValid: false, error: CollectionFieldsEnum.BOLT12 + 'is mandatory.' };
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.AMOUNTMSAT)) {
    return { isValid: false, error: CollectionFieldsEnum.AMOUNTMSAT + 'is mandatory.' };
  }
  if (!documentToValidate.hasOwnProperty(CollectionFieldsEnum.TITLE)) {
    return { isValid: false, error: CollectionFieldsEnum.TITLE + 'is mandatory.' };
  }
  if (typeof documentToValidate[CollectionFieldsEnum.AMOUNTMSAT] !== 'number') {
    return { isValid: false, error: CollectionFieldsEnum.AMOUNTMSAT + 'should be a number.' };
  }
  return { isValid: true };
};
