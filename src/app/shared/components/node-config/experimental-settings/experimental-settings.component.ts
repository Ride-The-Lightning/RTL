import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faInfoCircle, faCode, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../services/logger.service';
import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { ConfigSettingsNode } from '../../../models/RTLconfig';
import { updateServiceSettings } from '../../../../store/rtl.actions';
import { setChildNodeSettingsLND } from '../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCL } from '../../../../cln/store/cln.actions';
import { setChildNodeSettingsECL } from '../../../../eclair/store/ecl.actions';
import { DataService } from '../../../services/data.service';
import { CommonService } from '../../../services/common.service';
import { ServicesEnum, UI_MESSAGES, LADS_POLICY } from '../../../services/consts-enums-functions';
import { balance } from '../../../../cln/store/cln.selector';
import { Balance, FunderPolicy } from '../../../models/clnModels';
import { ApiCallStatusPayload } from '../../../models/apiCallsPayload';

@Component({
  selector: 'rtl-experimental-settings',
  templateUrl: './experimental-settings.component.html',
  styleUrls: ['./experimental-settings.component.scss']
})
export class ExperimentalSettingsComponent implements OnInit, OnDestroy {

  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public faCode = faCode;
  public features = [{ name: 'Offers', enabled: false }, { name: 'Channel Funding Policy', enabled: false }];
  public enableOffers = false;
  public selNode: ConfigSettingsNode;
  public fundingPolicy: FunderPolicy = {};
  public policyTypes = LADS_POLICY;
  public selPolicyType = LADS_POLICY[0];
  public policyMod: number | null;
  public leaseFeeBaseSat: number | null;
  public leaseFeeBasis: number | null;
  public channelFeeMaxBaseSat: number | null;
  public channelFeeMaxProportional: number | null;
  public flgUpdateCalled = false;
  public updateMsg: { error?: string } | { data?: string } = {};
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];


  constructor(private logger: LoggerService, private store: Store<RTLState>, private dataService: DataService, private commonService: CommonService) { }

  ngOnInit() {
    this.dataService.listConfigs().pipe(takeUntil(this.unSubs[0])).subscribe({
      next: (res: any) => {
        this.logger.info('Received List Configs: ' + JSON.stringify(res));
        this.features[1].enabled = !!res['experimental-dual-fund'];
      }, error: (err) => {
        this.logger.error('List Configs Error: ' + JSON.stringify(err));
        this.features[1].enabled = false;
      }
    });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enableOffers = this.selNode.settings.enableOffers || false;
        this.features[0].enabled = this.enableOffers;
        this.logger.info(this.selNode);
      });
    this.store.select(balance).pipe(takeUntil(this.unSubs[2])).
      subscribe((balanceSeletor: { balance: Balance, apiCallStatus: ApiCallStatusPayload }) => {
        this.policyTypes[2].max = balanceSeletor.balance.totalBalance || 1000;
      });
  }

  onPanelExpanded(panelId: number) {
    if (panelId === 1 && !this.fundingPolicy.policy) {
      this.dataService.getOrUpdateFunderPolicy().pipe(takeUntil(this.unSubs[3])).subscribe((res: any) => {
        this.logger.info('Received Funder Update Policy: ' + JSON.stringify(res));
        this.fundingPolicy = res;
        if (this.fundingPolicy.policy) {
          this.selPolicyType = LADS_POLICY.find((policy) => policy.id === this.fundingPolicy.policy) || this.policyTypes[0];
        }
        this.policyMod = this.fundingPolicy.policy_mod || this.fundingPolicy.policy_mod === 0 ? this.fundingPolicy.policy_mod : null;
        this.leaseFeeBaseSat = this.fundingPolicy.lease_fee_base_msat ? this.fundingPolicy.lease_fee_base_msat / 1000 : this.fundingPolicy.lease_fee_base_msat === 0 ? 0 : null;
        this.leaseFeeBasis = this.fundingPolicy.lease_fee_basis || this.fundingPolicy.lease_fee_basis === 0 ? this.fundingPolicy.lease_fee_basis : null;
        this.channelFeeMaxBaseSat = this.fundingPolicy.channel_fee_max_base_msat ? this.fundingPolicy.channel_fee_max_base_msat / 1000 : this.fundingPolicy.channel_fee_max_base_msat === 0 ? 0 : null;
        this.channelFeeMaxProportional = this.fundingPolicy.channel_fee_max_proportional_thousandths || this.fundingPolicy.channel_fee_max_proportional_thousandths === 0 ? (this.fundingPolicy.channel_fee_max_proportional_thousandths * 1000) : null;
      });
    }
  }

  onUpdateFeature(): boolean | void {
    this.logger.info(this.selNode);
    this.selNode.settings.enableOffers = this.enableOffers;
    this.features[0].enabled = this.enableOffers;
    this.store.dispatch(updateServiceSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_SETTING, service: ServicesEnum.OFFERS, settings: { enableOffers: this.enableOffers } } }));
    this.store.dispatch(setChildNodeSettingsLND({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.enableOffers
      }
    }));
    this.store.dispatch(setChildNodeSettingsCL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.enableOffers
      }
    }));
    this.store.dispatch(setChildNodeSettingsECL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.enableOffers
      }
    }));
  }

  onUpdateFundingPolicy() {
    this.flgUpdateCalled = true;
    this.updateMsg = {};
    this.dataService.getOrUpdateFunderPolicy(this.selPolicyType.id, this.policyMod, this.leaseFeeBaseSat, this.leaseFeeBasis, (this.channelFeeMaxBaseSat || 0) * 1000, this.channelFeeMaxProportional ? this.channelFeeMaxProportional / 1000 : 0).
      pipe(takeUntil(this.unSubs[4])).
      subscribe({
        next: (updatePolicyRes: any) => {
          this.logger.info(updatePolicyRes);
          this.fundingPolicy = updatePolicyRes;
          this.updateMsg = { data: 'Compact Lease: ' + updatePolicyRes.compact_lease };
          setTimeout(() => { this.flgUpdateCalled = false; }, 5000);
        }, error: (err) => {
          this.logger.error(err);
          this.updateMsg = { error: this.commonService.extractErrorMessage(err, 'Error in updating funder policy') };
          setTimeout(() => { this.flgUpdateCalled = false; }, 5000);
        }
      });
  }

  onResetPolicy() {
    this.flgUpdateCalled = false;
    this.updateMsg = {};
    if (this.fundingPolicy.policy) {
      this.selPolicyType = LADS_POLICY.find((policy) => policy.id === this.fundingPolicy.policy) || this.policyTypes[0];
    } else {
      this.selPolicyType = LADS_POLICY[0];
    }
    this.policyMod = this.fundingPolicy.policy_mod || this.fundingPolicy.policy_mod === 0 ? this.fundingPolicy.policy_mod : null;
    this.leaseFeeBaseSat = this.fundingPolicy.lease_fee_base_msat ? this.fundingPolicy.lease_fee_base_msat / 1000 : this.fundingPolicy.lease_fee_base_msat === 0 ? 0 : null;
    this.leaseFeeBasis = this.fundingPolicy.lease_fee_basis || this.fundingPolicy.lease_fee_basis === 0 ? this.fundingPolicy.lease_fee_basis : null;
    this.channelFeeMaxBaseSat = this.fundingPolicy.channel_fee_max_base_msat ? this.fundingPolicy.channel_fee_max_base_msat / 1000 : this.fundingPolicy.channel_fee_max_base_msat === 0 ? 0 : null;
    this.channelFeeMaxProportional = this.fundingPolicy.channel_fee_max_proportional_thousandths || this.fundingPolicy.channel_fee_max_proportional_thousandths === 0 ? (this.fundingPolicy.channel_fee_max_proportional_thousandths * 1000) : null;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
