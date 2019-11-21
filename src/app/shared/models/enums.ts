export const CURRENCY_UNITS = [ 'Sats', 'BTC' ];

export const CURRENCY_UNIT_FORMATS = { Sats: '1.0-0', BTC: '1.6-6', OTHER: '1.2-2'};

export const TIME_UNITS = ['SECS', 'MINS', 'HOURS', 'DAYS'];

export const ADDRESS_TYPES = [
  { addressId: '0', addressTp: 'Bech32 (P2WKH)', addressDetails: 'Pay to witness key hash'},
  { addressId: '1', addressTp: 'P2SH (NP2WKH)', addressDetails: 'Pay to nested witness key hash (default)'}
];

export enum AuthenticateWith {
  TOKEN = 'TOKEN',
  PASSWORD = 'PASSWORD'
}

export enum TimeUnitEnum {
  SECS = 'SECS',
  MINS = 'MINS',
  HOURS = 'HOURS',
  DAYS = 'DAYS'
}

export enum CurrencyUnitEnum {
  SATS = 'Sats',
  BTC = 'BTC',
  LITOSHIS = 'LITOSHIS',
  LTC = 'LTC',
  OTHER = 'OTHER'
}
