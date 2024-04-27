import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Node } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { updateNodeSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../../store/rtl.selector';

@Component({
  selector: 'rtl-peerswap-service-settings',
  templateUrl: './peerswap-service-settings.component.html',
  styleUrls: ['./peerswap-service-settings.component.scss']
})
export class PeerswapServiceSettingsComponent implements OnInit, OnDestroy {

  public faInfoCircle = faInfoCircle;
  public selNode: Node | any;
  public enablePeerswap = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enablePeerswap = !!selNode?.settings.enablePeerswap;
        this.logger.info(selNode);
      });
  }

  onUpdateService(): boolean | void {
    this.store.dispatch(updateNodeSettings({ payload: this.selNode }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
