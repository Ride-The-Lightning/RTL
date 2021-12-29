import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Channel, GetInfo, ChannelEdge, Balance } from '../../../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, FEE_RATE_TYPES, APICallStatusEnum, UI_MESSAGES } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { CLChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { CLEffects } from '../../../../store/cl.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';

import { openAlert, openConfirmation } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { channelLookup, closeChannel, updateChannel } from '../../../../store/cl.actions';
import { channels, nodeInfoAndBalanceAndNumPeers } from '../../../../store/cl.selector';

@Component({
  selector: 'rtl-cl-channel-open-table',
  templateUrl: './channel-open-table.component.html',
  styleUrls: ['./channel-open-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class CLChannelOpenTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faEye = faEye;
  public faEyeSlash = faEyeSlash
  public totalBalance = 0;
  public displayedColumns: any[] = [];
  public channelsData: Channel[] = [];
  public channels: any;
  public myChanPolicy: any = {};
  public information: GetInfo = {};
  public numPeers = -1;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFilter = '';
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'msatoshi_to_us', 'msatoshi_to_them', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'balancedness', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select(nodeInfoAndBalanceAndNumPeers).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoBalNumpeersSelector: { information: GetInfo, balance: Balance, numPeers: number }) => {
        this.information = infoBalNumpeersSelector.information;
        this.numPeers = infoBalNumpeersSelector.numPeers;
        this.totalBalance = infoBalNumpeersSelector.balance.totalBalance;
        this.logger.info(infoBalNumpeersSelector);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1])).
      subscribe((channelsSeletor: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsData = channelsSeletor.activeChannels;
        if (this.channelsData.length > 0) {
          this.loadChannelsTable(this.channelsData);
        }
        this.logger.info(channelsSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.channelsData.length > 0) {
      this.loadChannelsTable(this.channelsData);
    }
  }

  onViewRemotePolicy(selChannel: Channel) {
    this.store.dispatch(channelLookup({ payload: { uiMessage: UI_MESSAGES.GET_REMOTE_POLICY, shortChannelID: selChannel.short_channel_id, showError: true } }));
    this.clEffects.setLookupCL.pipe(take(1)).subscribe((resLookup: ChannelEdge[]): boolean | void => {
      if (resLookup.length === 0) {
        return false;
      }
      let remoteNode: ChannelEdge = {};
      if (resLookup[0].source !== this.information.id) {
        remoteNode = resLookup[0];
      } else {
        remoteNode = resLookup[1];
      }
      const reorderedChannelPolicy = [
        [{ key: 'base_fee_millisatoshi', value: remoteNode.base_fee_millisatoshi, title: 'Base Fees (mSats)', width: 34, type: DataTypeEnum.NUMBER },
        { key: 'fee_per_millionth', value: remoteNode.fee_per_millionth, title: 'Fee/Millionth', width: 33, type: DataTypeEnum.NUMBER },
        { key: 'delay', value: remoteNode.delay, title: 'Delay', width: 33, type: DataTypeEnum.NUMBER }]
      ];
      const titleMsg = 'Remote policy for Channel: ' + ((!selChannel.alias && !selChannel.short_channel_id) ? selChannel.channel_id : (selChannel.alias && selChannel.short_channel_id) ? selChannel.alias + ' (' + selChannel.short_channel_id + ')' : selChannel.alias ? selChannel.alias : selChannel.short_channel_id);
      setTimeout(() => {
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: AlertTypeEnum.INFORMATION,
              alertTitle: 'Remote Channel Policy',
              titleMessage: titleMsg,
              message: reorderedChannelPolicy
            }
          }
        }));
      }, 0);
    });
  }

  onChannelUpdate(channelToUpdate: any) {
    if (channelToUpdate !== 'all' && channelToUpdate.state === 'ONCHAIN') {
      return;
    }
    if (channelToUpdate === 'all') {
      const confirmationMsg = [];
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM,
            alertTitle: 'Update Fee Policy',
            noBtnText: 'Cancel',
            yesBtnText: 'Update All',
            message: confirmationMsg,
            titleMessage: 'Update fee policy for all channels',
            flgShowInput: true,
            getInputs: [
              { placeholder: 'Base Fee (mSats)', inputType: 'number', inputValue: 1000, width: 48 },
              { placeholder: 'Fee Rate (mili mSats)', inputType: 'number', inputValue: 1, min: 1, width: 48, hintFunction: this.percentHintFunction }
            ]
          }
        }
      }));
      this.rtlEffects.closeConfirm.pipe(takeUntil(this.unSubs[1])).subscribe((confirmRes) => {
        if (confirmRes) {
          const base_fee = confirmRes[0].inputValue;
          const fee_rate = confirmRes[1].inputValue;
          this.store.dispatch(updateChannel({ payload: { baseFeeMsat: base_fee, feeRate: fee_rate, channelId: 'all' } }));
        }
      });
    } else {
      this.myChanPolicy = { fee_base_msat: 0, fee_rate_milli_msat: 0 };
      this.store.dispatch(channelLookup({ payload: { uiMessage: UI_MESSAGES.GET_CHAN_POLICY, shortChannelID: channelToUpdate.short_channel_id, showError: false } }));
      this.clEffects.setLookupCL.pipe(take(1)).subscribe((resLookup: ChannelEdge[]) => {
        if (resLookup.length > 0 && resLookup[0].source === this.information.id) {
          this.myChanPolicy = { fee_base_msat: resLookup[0].base_fee_millisatoshi, fee_rate_milli_msat: resLookup[0].fee_per_millionth };
        } else if (resLookup.length > 1 && resLookup[1].source === this.information.id) {
          this.myChanPolicy = { fee_base_msat: resLookup[1].base_fee_millisatoshi, fee_rate_milli_msat: resLookup[1].fee_per_millionth };
        } else {
          this.myChanPolicy = { fee_base_msat: 0, fee_rate_milli_msat: 0 };
        }
        this.logger.info(this.myChanPolicy);
        const titleMsg = 'Update fee policy for Channel: ' + ((!channelToUpdate.alias && !channelToUpdate.short_channel_id) ? channelToUpdate.channel_id : (channelToUpdate.alias && channelToUpdate.short_channel_id) ? channelToUpdate.alias + ' (' + channelToUpdate.short_channel_id + ')' : channelToUpdate.alias ? channelToUpdate.alias : channelToUpdate.short_channel_id);
        const confirmationMsg = [];
        setTimeout(() => {
          this.store.dispatch(openConfirmation({
            payload: {
              data: {
                type: AlertTypeEnum.CONFIRM,
                alertTitle: 'Update Fee Policy',
                noBtnText: 'Cancel',
                yesBtnText: 'Update',
                message: confirmationMsg,
                titleMessage: titleMsg,
                flgShowInput: true,
                getInputs: [
                  { placeholder: 'Base Fee (mSats)', inputType: 'number', inputValue: (this.myChanPolicy.fee_base_msat === '') ? 0 : this.myChanPolicy.fee_base_msat, width: 48 },
                  { placeholder: 'Fee Rate (mili mSats)', inputType: 'number', inputValue: this.myChanPolicy.fee_rate_milli_msat, min: 1, width: 48, hintFunction: this.percentHintFunction }
                ]
              }
            }
          }));
        }, 0);
      });
      this.rtlEffects.closeConfirm.
        pipe(takeUntil(this.unSubs[2])).
        subscribe((confirmRes) => {
          if (confirmRes) {
            const base_fee = confirmRes[0].inputValue;
            const fee_rate = confirmRes[1].inputValue;
            this.store.dispatch(updateChannel({ payload: { baseFeeMsat: base_fee, feeRate: fee_rate, channelId: channelToUpdate.channel_id } }));
          }
        });
    }
    this.applyFilter();
  }

  percentHintFunction(fee_rate_milli_msat) {
    return (fee_rate_milli_msat / 10000).toString() + '%';
  }

  onChannelClose(channelToClose: Channel) {
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Close Channel',
          titleMessage: 'Closing channel: ' + ((!channelToClose.alias && !channelToClose.short_channel_id) ? channelToClose.channel_id : (channelToClose.alias && channelToClose.short_channel_id) ? channelToClose.alias + ' (' + channelToClose.short_channel_id + ')' : channelToClose.alias ? channelToClose.alias : channelToClose.short_channel_id),
          noBtnText: 'Cancel',
          yesBtnText: 'Close Channel'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(closeChannel({ payload: { id: channelToClose.id, channelId: channelToClose.channel_id, force: false } }));
        }
      });
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          showCopy: true,
          component: CLChannelInformationComponent
        }
      }
    }));
  }

  loadChannelsTable(mychannels) {
    mychannels.sort((a, b) => ((a.active === b.active) ? 0 : ((b.active) ? 1 : -1)));
    this.channels = new MatTableDataSource<Channel>([...mychannels]);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => {
      const newChannel = ((channel.connected) ? 'connected' : 'disconnected') + (channel.channel_id ? channel.channel_id.toLowerCase() : '') +
        (channel.short_channel_id ? channel.short_channel_id.toLowerCase() : '') + (channel.id ? channel.id.toLowerCase() : '') + (channel.alias ? channel.alias.toLowerCase() : '') +
        (channel.private ? 'private' : 'public') + (channel.state ? channel.state.toLowerCase() : '') +
        (channel.funding_txid ? channel.funding_txid.toLowerCase() : '') + (channel.msatoshi_to_us ? channel.msatoshi_to_us : '') +
        (channel.msatoshi_total ? channel.msatoshi_total : '') + (channel.their_channel_reserve_satoshis ? channel.their_channel_reserve_satoshis : '') +
        (channel.our_channel_reserve_satoshis ? channel.our_channel_reserve_satoshis : '') + (channel.spendable_msatoshi ? channel.spendable_msatoshi : '');
      return newChannel.includes(fltr);
    };
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.channels.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.channels);
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.channels.data, 'Open-channels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
