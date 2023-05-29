import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { DataService } from '../../../../shared/services/data.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { CLNOfferInformation } from '../../../../shared/models/alertData';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

import { Offer, OfferRequest } from '../../../../shared/models/clnModels';

@Component({
  selector: 'rtl-cln-offer-information',
  templateUrl: './offer-information.component.html',
  styleUrls: ['./offer-information.component.scss']
})
export class CLNOfferInformationComponent implements OnInit, OnDestroy {

  public faReceipt = faReceipt;
  public faExclamationTriangle = faExclamationTriangle;
  public showAdvanced = false;
  public newlyAdded = false;
  public offer: Offer;
  public offerDecoded: OfferRequest = {};
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public flgOfferPaid = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNOfferInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNOfferInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar, private dataService: DataService) { }

  ngOnInit() {
    this.offer = this.data.offer;
    this.newlyAdded = !!this.data.newlyAdded;
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 220;
    }
    this.dataService.decodePayment(this.offer.bolt12!, true).
      pipe(takeUntil(this.unSubs[1])).subscribe((decodedOffer: OfferRequest) => {
        this.offerDecoded = decodedOffer;
        if (this.offerDecoded.offer_id && !this.offerDecoded.offer_amount_msat) {
          this.offerDecoded.offer_amount_msat = 0;
        }
      });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  onCopyOffer(payload: string) {
    this.snackBar.open('Offer copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

