import { MatPaginatorIntl } from '@angular/material';

export function getPaymentsPaginator() {
  const paymentsPaginator = new MatPaginatorIntl();
  paymentsPaginator.itemsPerPageLabel = 'Payments per page:';
  return paymentsPaginator;
}

export function getInvoicesPaginator() {
  const invoicesPaginator = new MatPaginatorIntl();
  invoicesPaginator.itemsPerPageLabel = 'Invoices per page:';
  return invoicesPaginator;
}