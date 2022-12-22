import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faRoute, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { CommonService } from '../../../shared/services/common.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Hop } from '../../../shared/models/lndModels';
import { AlertTypeEnum, DataTypeEnum, LND_DEFAULT_PAGE_SETTINGS, PAGE_SIZE, ScreenSizeEnum, SortOrderEnum } from '../../../shared/services/consts-enums-functions';

import { LNDEffects } from '../../store/lnd.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getQueryRoutes } from '../../store/lnd.actions';
import { PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { lndPageSettings } from '../../store/lnd.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'rtl-query-routes',
  templateUrl: './query-routes.component.html',
  styleUrls: ['./query-routes.component.scss']
})
export class QueryRoutesComponent implements OnInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  public colWidth = '20rem';
  public PAGE_ID = 'graph_lookup';
  public tableSetting: TableSetting = { tableId: 'query_routes', recordsPerPage: PAGE_SIZE, sortBy: 'hop_sequence', sortOrder: SortOrderEnum.ASCENDING };
  public destinationPubkey = '';
  public amount = null;
  public qrHops: any = new MatTableDataSource([]);
  public displayedColumns: any[] = [];
  public flgLoading: Array<Boolean | 'error'> = [false]; // 0: peers
  public faRoute = faRoute;
  public faExclamationTriangle = faExclamationTriangle;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private lndEffects: LNDEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.lndEffects.setQueryRoutes.pipe(takeUntil(this.unSubs[1])).subscribe((queryRoute) => {
      this.qrHops = new MatTableDataSource([]);
      if (queryRoute.routes && queryRoute.routes.length && queryRoute.routes.length > 0 && queryRoute.routes[0].hops) {
        this.flgLoading[0] = false;
        this.qrHops = new MatTableDataSource<Hop>([...queryRoute.routes[0].hops]);
        this.qrHops.data = queryRoute.routes[0].hops;
      } else {
        this.flgLoading[0] = 'error';
      }
      this.qrHops.sort = this.sort;
      this.qrHops.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    });
  }

  onQueryRoutes(): boolean | void {
    if (!this.destinationPubkey || !this.amount) {
      return true;
    }
    this.qrHops = new MatTableDataSource([]);
    this.flgLoading[0] = true;
    this.store.dispatch(getQueryRoutes({ payload: { destPubkey: this.destinationPubkey, amount: this.amount } }));
  }

  resetData() {
    this.destinationPubkey = '';
    this.amount = null;
    this.flgLoading[0] = false;
  }

  onHopClick(selHop: Hop, event: any) {
    const reorderedHop = [
      [{ key: 'hop_sequence', value: selHop.hop_sequence, title: 'Sequence', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'amt_to_forward', value: selHop.amt_to_forward, title: 'Amount To Forward (Sats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'fee_msat', value: selHop.fee_msat, title: 'Fee (mSats)', width: 34, type: DataTypeEnum.NUMBER }],
      [{ key: 'chan_capacity', value: selHop.chan_capacity, title: 'Channel Capacity (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'expiry', value: selHop.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'pubkey_alias', value: selHop.pubkey_alias, title: 'Peer Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'chan_id', value: selHop.chan_id, title: 'Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'pub_key', value: selHop.pub_key, title: 'Peer Pubkey', width: 100, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Route Information',
          message: reorderedHop
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
