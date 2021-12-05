import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { CLOfferInformation } from '../../../../shared/models/alertData';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

import { GetInfo, Offer } from '../../../../shared/models/clModels';
import { RTLState } from '../../../../store/rtl.state';
import { clNodeInformation, offers } from '../../../store/cl.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-cl-offer-information',
  templateUrl: './offer-information.component.html',
  styleUrls: ['./offer-information.component.scss']
})
export class CLOfferInformationComponent implements OnInit, OnDestroy {

  // public faReceipt = faReceipt;
  // public faExclamationTriangle = faExclamationTriangle;
  // public showAdvanced = false;
  // public newlyAdded = false;
  // public offer: Offer;
  // public qrWidth = 240;
  // public screenSize = '';
  // public screenSizeEnum = ScreenSizeEnum;
  // public flgOfferPaid = false;
  // public flgVersionCompatible: boolean = true;
  // private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLOfferInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: CLOfferInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar, private store: Store<RTLState>) { }

  ngOnInit() {
    // this.offer = this.data.offer;
    // this.newlyAdded = this.data.newlyAdded;
    // this.screenSize = this.commonService.getScreenSize();
    // if (this.screenSize === ScreenSizeEnum.XS) {
    //   this.qrWidth = 220;
    // }
    // this.store.select(clNodeInformation).pipe(takeUntil(this.unSubs[0])).
    //   subscribe((nodeInfo: GetInfo) => {
    //     this.flgVersionCompatible = this.commonService.isVersionCompatible(nodeInfo.api_version, '0.6.0');
    //   });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    // this.showAdvanced = !this.showAdvanced;
  }

  onCopyPayment(payload: string) {
    this.snackBar.open('Offer copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    // this.unSubs.forEach((completeSub) => {
    //   completeSub.next(null);
    //   completeSub.complete();
    // });
  }

}
