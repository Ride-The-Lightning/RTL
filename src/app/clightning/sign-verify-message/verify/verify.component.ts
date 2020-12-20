import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'rtl-cl-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class CLVerifyComponent implements OnInit, OnDestroy {
  public message = '';
  public verifiedMessage = '';
  public signature = '';
  public verifiedSignature = '';
  public showVerifyStatus = false;
  public verifyRes = {pubkey: '', verified: null};
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private dataService: DataService, private snackBar: MatSnackBar, private logger: LoggerService) {}

  ngOnInit() {}

  onVerify():boolean|void {
    if ((!this.message || this.message === '') || (!this.signature || this.signature === '')) { return true; }
    this.dataService.verifyMessage(this.message, this.signature).pipe(takeUntil(this.unSubs[0]))
    .subscribe(res => { 
      this.verifyRes = res; 
      this.showVerifyStatus = true;
      this.verifiedMessage = this.message;
      this.verifiedSignature = this.signature;
    });
  } 

  onChange() {
    if (this.verifiedMessage !== this.message || this.verifiedSignature !== this.signature) { 
      this.showVerifyStatus = false;
      this.verifyRes = {pubkey: '', verified: null}; 
    }
  }

  resetData() {
    this.message = '';
    this.signature = '';
    this.verifyRes = null;
    this.showVerifyStatus = false;
  }

  onCopyField(payload: string) {
    this.snackBar.open('Pubkey copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
