import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { RTLState } from '../../../../store/rtl.state';
import { GetInfo, LookupNode, OnChainBalance } from '../../../../shared/models/eclModels';
import { NodeFeaturesECL } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { ECLConnectPeerComponent } from '../../../peers-channels/connect-peer/connect-peer.component';
import { eclNodeInformation, onchainBalance } from '../../../store/ecl.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { openAlert } from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-ecl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class ECLNodeLookupComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @Input() lookupResult: LookupNode = {};
  public addresses: any = new MatTableDataSource([]);
  public displayedColumns = ['address', 'actions'];
  public nodeFeaturesEnum = NodeFeaturesECL;
  public information: GetInfo = {};
  public availableBalance = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar, private store: Store<RTLState>) { }

  ngOnInit() {
    this.addresses = this.lookupResult.addresses ? new MatTableDataSource<any>([...this.lookupResult.addresses]) : new MatTableDataSource([]);
    this.addresses.data = this.lookupResult.addresses || [];
    this.addresses.sort = this.sort;
    this.addresses.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: any) => {
        this.information = nodeInfo;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[1])).
      subscribe((oCBalanceSelector: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.availableBalance = oCBalanceSelector.onchainBalance.total || 0;
      });
  }

  onConnectNode(address: string) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: {
            peer: this.lookupResult.nodeId ? { nodeId: this.lookupResult.nodeId, address: address } : null,
            information: this.information,
            balance: this.availableBalance
          },
          component: ECLConnectPeerComponent
        }
      }
    }));
  }

  onCopyNodeURI(payload: string) {
    this.snackBar.open('Node URI copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
