import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'rtl-peer-swaps-in',
  templateUrl: './swaps-in.component.html',
  styleUrls: ['./swaps-in.component.scss']
})
export class PeerswapsInComponent implements OnDestroy {

  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor() {}

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
