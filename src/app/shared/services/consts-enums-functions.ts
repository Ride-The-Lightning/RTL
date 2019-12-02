import { MatPaginatorIntl } from '@angular/material';

export function getPaginatorLabel(field: string) {
  const appPaginator = new MatPaginatorIntl();
  appPaginator.itemsPerPageLabel = field + ' per page:';
  return appPaginator;
}

export const CURRENCY_UNITS = [ 'Sats', 'BTC' ];
export const CURRENCY_UNIT_FORMATS = { Sats: '1.0-0', BTC: '1.6-6', OTHER: '1.2-2'};

export const TIME_UNITS = ['SECS', 'MINS', 'HOURS', 'DAYS'];

export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export const ADDRESS_TYPES = [
  { addressId: '0', addressTp: 'Bech32 (P2WKH)', addressDetails: 'Pay to witness key hash'},
  { addressId: '1', addressTp: 'P2SH (NP2WKH)', addressDetails: 'Pay to nested witness key hash (default)'}
];

export const TRANS_TYPES = [
  {id: '0', name: 'Priority (Default)'},
  {id: '1', name: 'Target Confirmation Blocks'},
  {id: '2', name: 'Fee'}
];

export enum AlertTypeEnum {
  INFORMATION = 'Information',
  WARNING = 'Warning',
  ERROR = 'Error',
  SUCCESS = 'Success',
  CONFIRM = 'Confirm'
}

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

export enum DataTypeEnum {
  ARRAY = 'ARRAY',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  PASSWORD = 'PASSWORD',
  DATE = 'DATE',
  DATE_TIME = 'DATE_TIME'
}
