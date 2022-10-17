import { SortOrderEnum } from '../services/consts-enums-functions';

export class TableSetting {

  tableId: string;
  recordsPerPage?: number;
  sortBy?: string;
  sortOrder?: SortOrderEnum;
  columnSelectionSM?: any[];
  columnSelection?: any[];

}

export class PageSettingsCLN {

  pageId: string;
  tables: TableSetting[];

}
