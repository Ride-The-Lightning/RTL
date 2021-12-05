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
import { setChildNodeSettingsCL } from '../../../../clightning/store/cl.actions';
import { setChildNodeSettingsECL } from '../../../../eclair/store/ecl.actions';
import { ServicesEnum, UI_MESSAGES } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-experimental-settings',
  templateUrl: './experimental-settings.component.html',
  styleUrls: ['./experimental-settings.component.scss']
})
export class ExperimentalSettingsComponent implements OnInit, OnDestroy {

  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public faCode = faCode;
  public features = [{ name: 'Offers', enabled: false }];
  public enableOffers = false;
  public selNode: ConfigSettingsNode;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enableOffers = this.selNode.settings.enableOffers;
        this.features[0].enabled = this.enableOffers;
        this.logger.info(this.selNode);
      });
  }

  onUpdateFeature(): boolean | void {
    this.logger.info(this.selNode);
    this.selNode.settings.enableOffers = this.enableOffers;
    this.features[0].enabled = this.enableOffers;
    this.store.dispatch(updateServiceSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_SETTING, service: ServicesEnum.OFFERS, settings: { enableOffers: this.enableOffers } } }));
    this.store.dispatch(setChildNodeSettingsLND({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.enableOffers
      }
    }));
    this.store.dispatch(setChildNodeSettingsCL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.enableOffers
      }
    }));
    this.store.dispatch(setChildNodeSettingsECL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.enableOffers
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
