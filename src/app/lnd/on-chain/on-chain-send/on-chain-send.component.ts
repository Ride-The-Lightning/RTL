import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SelNodeChild, GetInfoRoot } from '../../../shared/models/RTLconfig';
import { GetInfo, Balance, ChannelsTransaction, AddressType } from '../../../shared/models/lndModels';
import { CURRENCY_UNITS, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, AlertTypeEnum, DataTypeEnum } from '../../../shared/services/consts-enums-functions';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import * as sha256 from 'sha256';

import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-on-chain-send',
  templateUrl: './on-chain-send.component.html',
  styleUrls: ['./on-chain-send.component.scss']
})
export class OnChainSendComponent implements OnInit, OnDestroy {
  @Input() sweepAll = false;
  private _sweepBalance = 0;
  get sweepBalance() {
    return this._sweepBalance;
  }
  @Input() set sweepBalance(bal) {
    this._sweepBalance = bal;
    this.transaction.amount = this._sweepBalance;
  }
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public nodeData: GetInfoRoot;
  public addressTypes = [];
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress: AddressType = {};
  public blockchainBalance: Balance = {};
  public information: GetInfo = {};
  public newAddress = '';
  public transaction: ChannelsTransaction = {};
  public transTypes = [{id: '1', name: 'Target Confirmation Blocks'}, {id: '2', name: 'Fee'}];
  public selTransType = '1';
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService, private decimalPipe: DecimalPipe, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rootStore) => {
      this.amountUnits = rootStore.selNode.settings.currencyUnits;
      this.appConfig = rootStore.appConfig;
      this.nodeData = rootStore.nodeData;
      this.logger.info(rootStore);
    });
  }

  onSendFunds() {
    if(this.transaction.amount && this.selAmountUnit !== CurrencyUnitEnum.SATS) {
      this.commonService.convertCurrency(this.transaction.amount, this.selAmountUnit === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : this.selAmountUnit, this.amountUnits[2])
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(data => {
        this.transaction.amount = parseInt(data[CurrencyUnitEnum.SATS]);
        this.confirmSend();
      });
    } else {
      this.confirmSend();
    }
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[2]))
    .subscribe(pwdConfirmRes => {
      if (pwdConfirmRes) {
        if (this.sweepAll && !+this.appConfig.sso.rtlSSO) {
          const pwd = pwdConfirmRes[0].inputValue;
          this.store.dispatch(new RTLActions.IsAuthorized(sha256(pwd)));
          this.rtlEffects.isAuthorizedRes
          .pipe(take(1))
          .subscribe(authRes => {
            if (authRes !== 'ERROR') {
              this.dispatchToSendFunds();
            } else {
              this.snackBar.open('Unauthorized User. Logging out from RTL.');
            }
          });
        } else {
          this.dispatchToSendFunds();
        }
      }
    });
  }

  confirmSend() {
    const confirmationMsg: Array<Array<MessageDataField>> = [
      [{key: 'address', value: this.transaction.address, title: 'BTC Address', width: 100}]
    ];
    if (this.sweepAll) {
      confirmationMsg.push([{key: 'sweep_all', value: true, title: 'Sweep All', width: 50, type: DataTypeEnum.BOOLEAN}]);
      this.transaction.sendAll = true;
    } else {
      confirmationMsg.push([{key: 'amount', value: this.transaction.amount, title: 'Amount (' + this.nodeData.smaller_currency_unit + ')', width: 50, type: DataTypeEnum.NUMBER}]);
      this.transaction.sendAll = false;
    }
    if (this.selTransType === '1') {
      delete this.transaction.fees;
      confirmationMsg[1].push({key: 'target_conf_blocks', value: this.transaction.blocks, title: 'Target Confirmation Blocks', width: 50, type: DataTypeEnum.NUMBER});
    } else {
      delete this.transaction.blocks;
      confirmationMsg[1].push({key: 'fees_per_byte', value: this.transaction.fees, title: 'Fee (' + this.nodeData.smaller_currency_unit + '/Byte)', width: 50, type: DataTypeEnum.NUMBER});
    }
    if (this.sweepAll && !+this.appConfig.sso.rtlSSO) {
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Confirm Payment',
        titleMessage: 'Please authorize to sweep all funds with login password.',
        message: confirmationMsg,
        noBtnText: 'Cancel',
        yesBtnText: 'Authorize And Sweep All',
        flgShowInput: true,
        getInputs: [{placeholder: 'Enter Login Password', inputType: 'password', inputValue: ''}]
      }}));
    } else {
      this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
        type: AlertTypeEnum.CONFIRM,
        alertTitle: 'Confirm Payment',
        message: confirmationMsg,
        noBtnText: 'Cancel',
        yesBtnText: 'Send'
      }}));
    }
  }

  dispatchToSendFunds() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    this.store.dispatch(new RTLActions.SetChannelTransaction(this.transaction));
    this.transaction = {};
  }

  get invalidValues(): boolean {
    return (this.transaction.address === '') || (this.transaction.amount <= 0)
    || (this.selTransType === '1' && this.transaction.blocks && this.transaction.blocks <= 0) || (this.selTransType === '2' && this.transaction.fees && this.transaction.fees <= 0);
  }

  resetData() {
    this.selTransType = '1';      
    if (this.sweepAll) {
      this.transaction.address = '';
      this.transaction.blocks = null;
      this.transaction.fees = null;
    } else {
      this.transaction.address = '';
      this.transaction.amount = null;
      this.transaction.blocks = null;
      this.transaction.fees = null;
    }
  }

  onAmountUnitChange(event: any) {
    let self = this;
    let prevSelectedUnit = (this.sweepAll) ? CurrencyUnitEnum.SATS : (this.selAmountUnit === this.amountUnits[2]) ? CurrencyUnitEnum.OTHER : this.selAmountUnit;
    let currSelectedUnit = event.value === this.amountUnits[2] ? CurrencyUnitEnum.OTHER : event.value;
    if(this.transaction.amount && this.selAmountUnit !== event.value) {
      let amount = (this.sweepAll) ? this.sweepBalance : this.transaction.amount;
      this.commonService.convertCurrency(amount, prevSelectedUnit, this.amountUnits[2])
      .pipe(takeUntil(this.unSubs[4]))
      .subscribe(data => {
        self.transaction.amount = +self.decimalPipe.transform(data[currSelectedUnit], self.currencyUnitFormats[currSelectedUnit]).replace(/,/g, '');
      });
    }
    this.selAmountUnit = event.value;
  }  

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
