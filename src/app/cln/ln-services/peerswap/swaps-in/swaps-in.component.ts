import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { LoggerService } from '../../../../shared/services/logger.service';

@Component({
  selector: 'rtl-peer-swaps-in',
  templateUrl: './swaps-in.component.html',
  styleUrls: ['./swaps-in.component.scss']
})
export class PeerswapsInComponent implements OnInit, OnDestroy {

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
