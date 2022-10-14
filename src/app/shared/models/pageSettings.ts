import { SortOrderEnum } from '../services/consts-enums-functions';

export class TableSetting {

  tableId: string;
  recordsPerPage?: number;
  sortBy?: string;
  sortOrder?: SortOrderEnum;
  showColumns?: any[];

}

export class PageSettingsCLN {

  payments?: { seq?: number, tables?: TableSetting[] };
  invoices?: { seq?: number, tables?: TableSetting[] };
  utxos?: { seq?: number, tables?: TableSetting[] };

}
