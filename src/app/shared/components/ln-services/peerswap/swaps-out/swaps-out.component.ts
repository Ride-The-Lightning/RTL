import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'rtl-peer-swaps-out',
  templateUrl: './swaps-out.component.html',
  styleUrls: ['./swaps-out.component.scss']
})
export class PeerswapsOutComponent implements OnDestroy {

  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor() {}

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
