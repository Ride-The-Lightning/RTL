import { SortOrderEnum } from '../services/consts-enums-functions';

export class TableSetting {

  tableId: string;
  recordsPerPage?: number;
  sortBy?: string;
  sortOrder?: SortOrderEnum;
  columnSelectionSM?: string[];
  columnSelection?: string[];

}

export class PageSettings {

  pageId: string;
  tables: TableSetting[];

}

export class ColumnDefinition {

  column: string;
  label?: string;
  disabled?: boolean;

}

export class TableDefinition {

  maxColumns: number;
  disablePageSize?: boolean;
  allowedColumns: ColumnDefinition[];

}

export class LNDPageDefinitions {

  on_chain: {
    utxos: TableDefinition;
    transactions: TableDefinition;
    dust_utxos: TableDefinition;
  };
  peers_channels: {
    open: TableDefinition;
    pending_open: TableDefinition;
    pending_force_closing: TableDefinition;
    pending_closing: TableDefinition;
    pending_waiting_close: TableDefinition;
    closed: TableDefinition;
    active_HTLCs: TableDefinition;
    peers: TableDefinition;
  };
  transactions: {
    payments: TableDefinition;
    invoices: TableDefinition;
  };
  routing: {
    forwarding_history: TableDefinition;
    routing_peers: TableDefinition;
    non_routing_peers: TableDefinition;
  };
  reports: {
    routing: TableDefinition;
    transactions: TableDefinition;
  };
  graph_lookup: {
    query_routes: TableDefinition;
  };
  loop: {
    loop: TableDefinition;
  };
  boltz: {
    swap_out: TableDefinition;
    swap_in: TableDefinition;
  };

};

export class ECLPageDefinitions {

  on_chain: {
    transaction: TableDefinition;
  };
  peers_channels: {
    open_channels: TableDefinition;
    pending_channels: TableDefinition;
    inactive_channels: TableDefinition;
    peers: TableDefinition;
  };
  transactions: {
    payments: TableDefinition;
    invoices: TableDefinition;
  };
  routing: {
    forwarding_history: TableDefinition;
    routing_peers: TableDefinition;
  };
  reports: {
    routing: TableDefinition;
    transactions: TableDefinition;
  };

};

export class CLNPageDefinitions {

  on_chain: {
    utxos: TableDefinition;
    dust_utxos: TableDefinition;
  };
  peers_channels: {
    open_channels: TableDefinition;
    pending_inactive_channels: TableDefinition;
    peers: TableDefinition;
    active_HTLCs: TableDefinition;
  };
  liquidity_ads: {
    liquidity_ads: TableDefinition;
  };
  transactions: {
    payments: TableDefinition;
    invoices: TableDefinition;
    offers: TableDefinition;
    offer_bookmarks: TableDefinition;
  };
  routing: {
    forwarding_history: TableDefinition;
    routing_peers: TableDefinition;
    failed: TableDefinition;
    local_failed: TableDefinition;
  };
  reports: {
    routing: TableDefinition;
    transactions: TableDefinition;
  };
  graph_lookup: {
    query_routes: TableDefinition;
  };
  peerswap: {
    psout: TableDefinition;
    psin: TableDefinition;
    pscanceled: TableDefinition;
  };

};
