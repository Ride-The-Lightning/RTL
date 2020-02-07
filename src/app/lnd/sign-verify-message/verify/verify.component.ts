import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DataService } from '../../../shared/services/data.service';

@Component({
  selector: 'rtl-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit, OnDestroy {
  public message = '';
  public signature = '';
  public verifyRes = {pubkey: '', valid: null};
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private dataService: DataService) {}

  ngOnInit() {}

  onVerify() {
    if ((!this.message || this.message === '') || (!this.signature || this.signature === '')) { return true; }
    this.dataService.verifyMessage(this.message, this.signature).pipe(takeUntil(this.unSubs[0])).subscribe(res => { this.verifyRes = res; });
  } 

  resetData() {
    this.message = '';
    this.signature = '';
    this.verifyRes = null;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
