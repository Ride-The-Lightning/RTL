import { Component, OnInit, Inject, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PaymentSent } from '../../../shared/models/eclModels';
import { ECLPaymentInformation } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-ecl-payment-information',
  templateUrl: './payment-information.component.html',
  styleUrls: ['./payment-information.component.scss']
})
export class ECLPaymentInformationComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer', { static: false }) scrollContainer: ElementRef;
  public payment: PaymentSent;
  public description: string = null;
  public shouldScroll = true;
  public expansionOpen = true;

  constructor(public dialogRef: MatDialogRef<ECLPaymentInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLPaymentInformation) { }

  ngOnInit() {
    this.payment = this.data.payment;
    if (this.data.sentPaymentInfo.length > 0 && this.data.sentPaymentInfo[0].paymentRequest && this.data.sentPaymentInfo[0].paymentRequest.description && this.data.sentPaymentInfo[0].paymentRequest.description !== '') {
      this.description = this.data.sentPaymentInfo[0].paymentRequest.description;
    }
  }

  ngAfterViewChecked() {
    this.shouldScroll = this.scrollContainer.nativeElement.classList.value.includes('ps--active-y');
  }

  onScrollDown() {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollTop + 62.6;
  }

  onExpansionOpen(opened: boolean) {
    this.expansionOpen = opened;
  }

  onClose() {
    this.dialogRef.close(false);
  }

}
