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
  @ViewChild('scrollContainer', { static: true }) scrollContainer: ElementRef;
  public payment: PaymentSent;
  public shouldScroll = true;
  public expansionOpen = false;

  constructor(public dialogRef: MatDialogRef<ECLPaymentInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLPaymentInformation) { }

  ngOnInit() {
    this.payment = this.data.payment;
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
