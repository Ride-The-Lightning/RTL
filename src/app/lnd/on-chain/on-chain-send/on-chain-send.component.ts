import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { GetInfo, Balance, ChannelsTransaction, AddressType } from '../../../shared/models/lndModels';
import { CURRENCY_UNITS } from '../../../shared/models/enums';
import { RTLConfiguration } from '../../../shared/models/RTLconfig';
import { LoggerService } from '../../../shared/services/logger.service';
import * as sha256 from 'sha256';

import { LNDEffects } from '../../store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-on-chain-send',
  templateUrl: './on-chain-send.component.html',
  styleUrls: ['./on-chain-send.component.scss']
})
export class OnChainSendComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public appConfig: RTLConfiguration;
  public addressTypes = [];
  public flgLoadingWallet: Boolean | 'error' = true;
  public selectedAddress: AddressType = {};
  public blockchainBalance: Balance = {};
  public information: GetInfo = {};
  public newAddress = '';
  public transaction: ChannelsTransaction = {};
  public transTypes = [{id: '1', name: 'Target Confirmation Blocks'}, {id: '2', name: 'Fee'}];
  public selTransType = '1';
  public flgCustomAmount = '1';
  public amountUnits = CURRENCY_UNITS;
  public selAmountUnit = CURRENCY_UNITS[0];
  public currConvertorRate = {};
  public unitConversionValue = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private httpClient: HttpClient) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rootStore) => {
      this.appConfig = rootStore.appConfig;
      this.logger.info(rootStore);
    });
  }

  onSendFunds() {
    const confirmationMsg = {
      'BTC Address': this.transaction.address,
    };
    if (!+this.flgCustomAmount) {
      confirmationMsg['Sweep All'] = 'True';
      this.transaction.sendAll = true;
    } else {
      confirmationMsg['Amount (' + this.information.smaller_currency_unit + ')'] = this.transaction.amount;
      this.transaction.sendAll = false;
    }
    if (this.selTransType === '1') {
      delete this.transaction.fees;
      confirmationMsg['Target Confirmation Blocks'] = this.transaction.blocks;
    } else {
      delete this.transaction.blocks;
      confirmationMsg['Fee (' + this.information.smaller_currency_unit + '/Byte)'] = this.transaction.fees;
    }
    this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data:
      {type: 'CONFIRM', message: JSON.stringify(confirmationMsg), noBtnText: 'Cancel', yesBtnText: 'Send'}
    }));

    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[2]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        if (this.transaction.sendAll && !+this.appConfig.sso.rtlSSO) {
          this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data:
            {type: 'CONFIRM', titleMessage: 'Enter Login Password', noBtnText: 'Cancel', yesBtnText: 'Authorize', flgShowInput: true, getInputs: [
              {placeholder: 'Enter Login Password', inputType: 'password', inputValue: ''}
            ]}
          }));
          this.rtlEffects.closeConfirm
          .pipe(takeUntil(this.unSubs[3]))
          .subscribe(pwdConfirmRes => {
            if (pwdConfirmRes) {
              const pwd = pwdConfirmRes[0].inputValue;
              this.store.dispatch(new RTLActions.IsAuthorized(sha256(pwd)));
              this.rtlEffects.isAuthorizedRes
              .pipe(take(1))
              .subscribe(authRes => {
                if (authRes !== 'ERROR') {
                  this.dispatchToSendFunds();
                }
              });
            }
          });
        } else {
          this.dispatchToSendFunds();
        }
      }
    });
  }

  dispatchToSendFunds() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Funds...'));
    this.store.dispatch(new RTLActions.SetChannelTransaction(this.transaction));
    this.transaction = {address: '', amount: 0, blocks: 0, fees: 0};
  }

  get invalidValues(): boolean {
    return (undefined === this.transaction.address || this.transaction.address === '')
        || (+this.flgCustomAmount && (undefined === this.transaction.amount || this.transaction.amount <= 0))
        || (this.selTransType === '1' && (undefined === this.transaction.blocks || this.transaction.blocks <= 0))
        || (this.selTransType === '2' && (undefined === this.transaction.fees || this.transaction.fees <= 0));
  }

  onCustomClicked() {
    this.flgCustomAmount = '1';
  }

  onOptionChange(event) {
    if (!+this.flgCustomAmount) {
      delete this.transaction.amount;
    }
  }

  resetData() {
    this.transaction.address = '';
    this.transaction.amount = 0;
    this.transaction.blocks = 0;
    this.transaction.fees = 0;
  }

  resetReceiveData() {
    this.selectedAddress = {};
    this.newAddress = '';
  }

  onAmountUnitChange(event: any) {
    if(this.transaction.amount && this.selAmountUnit !== event.value) {
      switch (this.selAmountUnit) {
        case this.amountUnits[0]:
          switch (event.value) {
            case this.amountUnits[1]:
              this.transaction.amount = this.transaction.amount * 0.00000001;
              break;
            case this.amountUnits[2]:
              // this.transaction.amount = +this.currencyConvert.transform(this.transaction.amount.toString(), this.currConvertorRate[this.amountUnits[2]].last * 0.00000001);
              break;
            default:
              break;
          }
          break;
        case this.amountUnits[1]:
          switch (event.value) {
            case this.amountUnits[0]:
              this.transaction.amount = this.transaction.amount * 100000000;
              break;
            case this.amountUnits[2]:
              // this.transaction.amount = +this.currencyConvert.transform(this.transaction.amount.toString(), this.currConvertorRate[this.amountUnits[2]].last);
              break;
            default:
              break;
          }
          break;
        case this.amountUnits[2]:
          switch (event.value) {
            case this.amountUnits[0]:
              // this.transaction.amount = +this.currencyConvert.transform(this.transaction.amount.toString(), this.currConvertorRate[this.amountUnits[2]].last) * 10000000;
              break;
            case this.amountUnits[1]:
              // this.transaction.amount = +this.currencyConvert.transform(this.transaction.amount.toString(), this.currConvertorRate[this.amountUnits[2]].last);
              break;
            default:
              break;
          }
          break;
        default:
          break;
      }
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
