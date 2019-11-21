import { MatPaginatorIntl } from '@angular/material';

export function getPaginatorLabel(field: string) {
  const appPaginator = new MatPaginatorIntl();
  field = field.charAt(0).toUpperCase() + field.substring(1).toLowerCase();
  appPaginator.itemsPerPageLabel = field + ' per page:';
  return appPaginator;
}
