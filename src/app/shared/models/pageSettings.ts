import { SortOrderEnum } from '../services/consts-enums-functions';

export class TableSetting {

  tableId: string;
  recordsPerPage?: number;
  sortBy?: string;
  sortOrder?: SortOrderEnum;
  showColumns?: any[];
  fieldsDef?: any[];

}

export class NodePageSettings {

  seq: number;
  pageId: string;
  tables: TableSetting[];

}

export class RTLPageSettings {

  LND?: NodePageSettings[];
  CLN?: NodePageSettings[];
  ECL?: NodePageSettings[];

}

export const RTL_PAGE_SETTINGS: RTLPageSettings = {
  LND: [],
  CLN: [
    { seq: 1, pageId: 'payments', tables: [{
      tableId: 'payments', recordsPerPage: 25, sortBy: 'created_at', sortOrder: SortOrderEnum.DESCENDING,
      showColumns: ['created_at', 'type', 'payment_hash', 'msatoshi_sent', 'msatoshi'],
      fieldsDef: ['created_at', 'type', 'payment_hash', 'msatoshi_sent', 'msatoshi', 'amount_msat', 'amount_sent_msat', 'destination', 'status', 'memo']
    }] },
    { seq: 2, pageId: 'invoices', tables: [{
      tableId: 'invoices', recordsPerPage: 10, sortBy: 'expires_at', sortOrder: SortOrderEnum.ASCENDING,
      showColumns: ['expires_at', 'paid_at', 'type', 'description', 'msatoshi', 'msatoshi_received'],
      fieldsDef: ['expires_at', 'paid_at', 'type', 'description', 'msatoshi', 'msatoshi_received', 'label', 'payment_hash', 'amount_msat', 'status', 'amount_received_msat']
    }] }
  ],
  ECL: []
};
