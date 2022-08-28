import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { LoggerService } from '../../../../shared/services/logger.service';

@Component({
  selector: 'rtl-peer-swaps-out',
  templateUrl: './swaps-out.component.html',
  styleUrls: ['./swaps-out.component.scss']
})
export class PeerswapsOutComponent implements OnInit, OnDestroy {

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
