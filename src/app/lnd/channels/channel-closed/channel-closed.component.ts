import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { ClosedChannel } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

import * as LNDActions from '../../store/lnd.actions';
import * as fromLNDReducer from '../../store/lnd.reducers';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-closed',
  templateUrl: './channel-closed.component.html',
  styleUrls: ['./channel-closed.component.scss']
})
export class ChannelClosedComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public displayedColumns = [];
  public closedChannels: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public selectedFilter = '';
  public flgSticky = false;
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private lndStore: Store<fromLNDReducer.LNDState>, private actions$: Actions) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['close_type', 'chan_id', 'settled_balance'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['close_type', 'channel_point', 'chan_id', 'settled_balance'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['close_type', 'channel_point', 'chan_id', 'capacity', 'close_height', 'settled_balance'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['close_type', 'channel_point', 'chan_id', 'closing_tx_hash', 'remote_pubkey', 'capacity',
          'close_height', 'settled_balance', 'time_locked_balance'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['close_type', 'channel_point', 'chan_id', 'closing_tx_hash', 'remote_pubkey', 'capacity',
          'close_height', 'settled_balance', 'time_locked_balance'];
        break;
    }
  }

  ngOnInit() {
    this.store.dispatch(new LNDActions.FetchChannels({routeParam: 'closed'}));
    this.actions$.pipe(takeUntil(this.unsubs[2]), filter((action) => action.type === RTLActions.RESET_STORE)).subscribe((resetStore: RTLActions.ResetStore) => {
      this.store.dispatch(new LNDActions.FetchChannels({routeParam: 'closed'}));
    });
    this.lndStore.select('lnd')
    .pipe(takeUntil(this.unsubs[3]))
    .subscribe(lndStore => {
      if (undefined !== lndStore.closedChannels) {
        this.loadClosedChannelsTable(lndStore.closedChannels);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== lndStore.closedChannels) ? false : true;
      }
      this.logger.info(lndStore);
    });
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/closed') {
          this.flgLoading[0] = 'error';
        }
      });
      this.logger.info(rtlStore);
    });

  }

  applyFilter(selFilter: string) {
    this.selectedFilter = selFilter;
    this.closedChannels.filter = selFilter;
  }

  onClosedChannelClick(selRow: ClosedChannel, event: any) {
    const selChannel = this.closedChannels.data.filter(closedChannel => {
      return closedChannel.chan_id === selRow.chan_id;
    })[0];
    const reorderedChannel = JSON.parse(JSON.stringify(selChannel, ['close_type', 'channel_point', 'chan_id', 'closing_tx_hash', 'remote_pubkey', 'capacity',
    'close_height', 'settled_balance', 'time_locked_balance'] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  loadClosedChannelsTable(closedChannels) {
    this.closedChannels = new MatTableDataSource<ClosedChannel>([...closedChannels]);
    this.closedChannels.sort = this.sort;
    this.logger.info(this.closedChannels);
  }

  resetData() {
    this.selectedFilter = '';
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
