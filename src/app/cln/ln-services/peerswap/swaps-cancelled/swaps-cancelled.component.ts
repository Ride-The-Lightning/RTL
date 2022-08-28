import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { LoggerService } from '../../../../shared/services/logger.service';

@Component({
  selector: 'rtl-peerswap-cancelled',
  templateUrl: './swaps-cancelled.component.html',
  styleUrls: ['./swaps-cancelled.component.scss']
})
export class PeerswapsCancelledComponent implements OnInit, OnDestroy {

  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService) {}

  ngOnInit() {
    this.logger.info('Peerswap Out');
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
