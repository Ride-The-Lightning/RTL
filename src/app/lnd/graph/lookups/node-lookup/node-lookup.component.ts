import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RTLState } from '../../../../store/rtl.state';
import { BlockchainBalance, GetInfo, GraphNode, NodeAddress } from '../../../../shared/models/lndModels';
import { NodeFeaturesLND } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { openAlert } from '../../../../store/rtl.actions';
import { ConnectPeerComponent } from '../../../peers-channels/connect-peer/connect-peer.component';
import { blockchainBalance, lndNodeInformation } from '../../../store/lnd.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class NodeLookupComponent implements OnInit, OnDestroy {

  @Input() lookupResult: GraphNode;
  public nodeFeaturesEnum = NodeFeaturesLND;
  public displayedColumns = ['network', 'addr', 'actions'];
  public information: GetInfo = {};
  public availableBalance = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[0])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[1])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.availableBalance = bcBalanceSelector.blockchainBalance.total_balance || 0;
      });
  }

  onCopyNodeURI(payload: string) {
    this.snackBar.open('Node URI copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  onConnectNode(address: NodeAddress) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: { peer: { pub_key: this.lookupResult.node?.pub_key, address: address.addr }, information: this.information, balance: this.availableBalance },
          component: ConnectPeerComponent
        }
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
