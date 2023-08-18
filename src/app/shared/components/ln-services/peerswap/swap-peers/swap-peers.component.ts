import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';

import { SwapPeerChannelsFlattened } from '../../../../models/peerswapModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, DataTypeEnum, AlertTypeEnum } from '../../../../services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../models/apiCallsPayload';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';

import { RTLState } from '../../../../../store/rtl.state';
import { openAlert } from '../../../../../store/rtl.actions';
import { fetchSwapPeers } from '../../../../../cln/store/cln.actions';
import { swapPeers } from '../../../../../cln/store/cln.selector';
import { PSSwapOutModalComponent } from '../swap-out-modal/swap-out-modal.component';
import { PSSwapInModalComponent } from '../swap-in-modal/swap-in-modal.component';

@Component({
  selector: 'rtl-peerswap-peers',
  templateUrl: './swap-peers.component.html',
  styleUrls: ['./swap-peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class SwapPeersComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faPeopleGroup = faPeopleGroup;
  public displayedColumns: any[] = [];
  public totalSwapPeers = 0;
  public peersData: SwapPeerChannelsFlattened[] = [];
  public swapPeers: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'short_channel_id', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'swaps_allowed', 'local_balance', 'remote_balance', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'swaps_allowed', 'local_balance', 'remote_balance', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['short_channel_id', 'alias', 'swaps_allowed', 'local_balance', 'remote_balance', 'actions'];
    }
  }

  ngOnInit() {
    this.store.dispatch(fetchSwapPeers());
    this.store.select(swapPeers).pipe(takeUntil(this.unSubs[0])).
      subscribe((spSeletor: { totalSwapPeers: number, swapPeers: SwapPeerChannelsFlattened[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = spSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalSwapPeers = spSeletor.totalSwapPeers;
        this.peersData = spSeletor.swapPeers || [];
        if (this.peersData.length > 0 && this.sort && this.paginator) {
          this.loadSwapPeersTable(this.peersData);
        }
        this.logger.info(spSeletor);
      });
  }

  onSwapPeerClick(selSPeer: SwapPeerChannelsFlattened) {
    const reorderedSPeer = [
      [{ key: 'nodeid', value: selSPeer.nodeid, title: 'Node Id', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'alias', value: selSPeer.alias, title: 'Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'short_channel_id', value: selSPeer.short_channel_id, title: 'Short Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'local_balance', value: selSPeer.local_balance, title: 'Local Balance (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'remote_balance', value: selSPeer.remote_balance, title: 'Remote Balance (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'total_fee_paid', value: selSPeer.total_fee_paid, title: 'Total Fee Paid (Sats)', width: 40, type: DataTypeEnum.NUMBER },
      { key: 'swaps_allowed', value: selSPeer.swaps_allowed ? 'Yes' : 'No', title: 'Swaps Allowed', width: 30, type: DataTypeEnum.STRING },
      { key: 'total_channels', value: selSPeer.channels?.length, title: 'Channels With Peer', width: 30, type: DataTypeEnum.NUMBER }],
      [{ key: 'sent_total_swaps_out', value: selSPeer.sent?.total_swaps_out, title: 'Swap Out Sent', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'sent_total_swaps_in', value: selSPeer.sent?.total_swaps_in, title: 'Swap In Sent', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'sent_total_sats_swapped_out', value: selSPeer.sent?.total_sats_swapped_out, title: 'Swapped Out Sent (Sats)', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'sent_total_sats_swapped_in', value: selSPeer.sent?.total_sats_swapped_in, title: 'Swapped In Sent (Sats)', width: 25, type: DataTypeEnum.NUMBER }],
      [{ key: 'received_total_swaps_out', value: selSPeer.received?.total_swaps_out, title: 'Swap Out Received', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'received_total_swaps_in', value: selSPeer.received?.total_swaps_in, title: 'Swap In Received', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'received_total_sats_swapped_out', value: selSPeer.received?.total_sats_swapped_out, title: 'Swapped Out Received (Sats)', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'received_total_sats_swapped_in', value: selSPeer.received?.total_sats_swapped_in, title: 'Swapped In Received (Sats)', width: 25, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Swap Peer Information',
          message: reorderedSPeer
        }
      }
    }));
  }

  onSwapOut(sPeer: SwapPeerChannelsFlattened) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          swapPeer: sPeer,
          component: PSSwapOutModalComponent
        }
      }
    }));
  }

  onSwapIn(sPeer: SwapPeerChannelsFlattened) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          swapPeer: sPeer,
          component: PSSwapInModalComponent
        }
      }
    }));
  }

  loadSwapPeersTable(swapPeers: SwapPeerChannelsFlattened[]) {
    this.swapPeers = new MatTableDataSource<SwapPeerChannelsFlattened>([...swapPeers]);
    this.swapPeers.sort = this.sort;
    this.swapPeers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.swapPeers.filterPredicate = (sPeer: SwapPeerChannelsFlattened, fltr: string) => {
      const newSPeer =
        (sPeer.nodeid ? sPeer.nodeid : '') +
        (sPeer.alias ? sPeer.alias.toLowerCase() : '') +
        (sPeer.swaps_allowed ? 'yes' : 'no') +
        (sPeer.short_channel_id ? sPeer.short_channel_id : '') +
        (sPeer.local_balance ? sPeer.local_balance : '') +
        (sPeer.remote_balance ? sPeer.remote_balance : '');
      return newSPeer?.includes(fltr) || false;
    };
    this.swapPeers.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.swapPeers);
  }

  onDownloadCSV() {
    if (this.swapPeers && this.swapPeers.data && this.swapPeers.data.length > 0) {
      this.commonService.downloadFile(this.swapPeers.data, 'Swap Peers');
    }
  }

  applyFilter() {
    this.swapPeers.filter = this.selFilter.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
