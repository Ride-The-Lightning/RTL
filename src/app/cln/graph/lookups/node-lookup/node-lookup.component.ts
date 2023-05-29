import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Address, Balance, GetInfo, LookupNode } from '../../../../shared/models/clnModels';
import { NODE_FEATURES_CLN } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { CLNConnectPeerComponent } from '../../../peers-channels/connect-peer/connect-peer.component';
import { nodeInfoAndBalance } from '../../../store/cln.selector';

@Component({
  selector: 'rtl-cln-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class CLNNodeLookupComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @Input() lookupResult: LookupNode;
  public featureDescriptions: string[] = [];
  public addresses: any = new MatTableDataSource([]);
  public displayedColumns = ['type', 'address', 'port', 'actions'];
  public information: GetInfo = {};
  public availableBalance = 0;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar, private store: Store<RTLState>) { }

  ngOnInit() {
    this.addresses = this.lookupResult && this.lookupResult.addresses ? new MatTableDataSource<any>([...this.lookupResult.addresses]) : new MatTableDataSource([]);
    this.addresses.data = this.lookupResult.addresses || [];
    this.addresses.sort = this.sort;
    this.addresses.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    if (this.lookupResult.features && this.lookupResult.features.trim() !== '') {
      this.lookupResult.features = this.lookupResult.features.substring(this.lookupResult.features.length - 40);
      const featureHex = parseInt(this.lookupResult.features, 16);
      NODE_FEATURES_CLN.forEach((feature) => {
        if (featureHex & (1 << feature.range.min)) {
          this.featureDescriptions.push('Mandatory: ' + feature.description + '\n');
        } else if (featureHex & (1 << feature.range.max)) {
          this.featureDescriptions.push('Optional: ' + feature.description + '\n');
        }
      });
    }
    this.store.select(nodeInfoAndBalance).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoBalSelector: { information: GetInfo, balance: Balance }) => {
        this.information = infoBalSelector.information;
        this.availableBalance = infoBalSelector.balance.totalBalance || 0;
      });
  }

  onConnectNode(address: Address) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          message: { peer: { id: this.lookupResult.nodeid + '@' + address.address + ':' + address.port }, information: this.information, balance: this.availableBalance },
          component: CLNConnectPeerComponent
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
