import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { SwapPeerChannelsFlattened } from '../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum } from '../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { fetchSwapPeers } from '../../../store/cln.actions';
import { swapPeers } from '../../../store/cln.selector';

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
  public displayedColumns: any[] = [];
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

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private router: Router) {
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
      this.displayedColumns = ['short_channel_id', 'alias', 'nodeid', 'swaps_allowed', 'local_balance', 'remote_balance', 'actions'];
    }
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.store.dispatch(fetchSwapPeers());
    this.store.select(swapPeers).pipe(takeUntil(this.unSubs[0])).
      subscribe((spSeletor: { swapPeers: SwapPeerChannelsFlattened[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = spSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.peersData = spSeletor.swapPeers || [];
        if (this.peersData.length > 0 && this.sort && this.paginator) {
          this.loadSwapPeersTable(this.peersData);
        }
        this.logger.info(spSeletor);
      });
  }

  onSwapPeerClick(selSPeer: SwapPeerChannelsFlattened) {
    this.logger.warn(selSPeer);
    // nodeid, alias, swaps_allowed, supported_assets[], total_fee_paid
    // channels: {short_channel_id, local_balance, remote_balance, local_percentage, state}[]
    // sent: {total_swaps_out, total_swaps_in, total_sats_swapped_out, total_sats_swapped_in}
    // received: {total_swaps_out, total_swaps_in, total_sats_swapped_out, total_sats_swapped_in}
    this.store.dispatch(openAlert({
      payload: {
        data: {
          // invoice: reCreatedInvoice,
          // newlyAdded: false,
          // component: CLNInvoiceInformationComponent
        }
      }
    }));
  }

  onSwapOut(sPeer) {
    this.logger.warn('Swap Out');
  }

  onSwapIn(sPeer) {
    this.logger.warn('Swap In');
  }

  loadSwapPeersTable(swapPeers: SwapPeerChannelsFlattened[]) {
    this.swapPeers = new MatTableDataSource<SwapPeerChannelsFlattened>([...swapPeers]);
    this.swapPeers.sort = this.sort;
    this.swapPeers.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.swapPeers.filterPredicate = (sPeer: SwapPeerChannelsFlattened, fltr: string) => {
      const newSPeer =
        (sPeer.nodeid ? sPeer.nodeid : '') +
        (sPeer.alias ? sPeer.alias.toLowerCase() : '') +
        (sPeer.swaps_allowed ? 'allowed' : 'denied') +
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
