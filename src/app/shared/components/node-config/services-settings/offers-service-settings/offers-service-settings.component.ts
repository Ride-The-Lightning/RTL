import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum, UI_MESSAGES } from '../../../../services/consts-enums-functions';
import { ConfigSettingsNode } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { updateServiceSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { setChildNodeSettingsLND } from '../../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCL } from '../../../../../clightning/store/cl.actions';
import { setChildNodeSettingsECL } from '../../../../../eclair/store/ecl.actions';
import { rootSelectedNode } from '../../../../../store/rtl.selector';

@Component({
  selector: 'rtl-offers-service-settings',
  templateUrl: './offers-service-settings.component.html',
  styleUrls: ['./offers-service-settings.component.scss']
})
export class OffersServiceSettingsComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public faInfoCircle = faInfoCircle;
  public selNode: ConfigSettingsNode;
  public enableOffers = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enableOffers = selNode.settings.enableOffers || false;
        this.logger.info(selNode);
      });
  }

  onEnableServiceChanged(event) {
    this.enableOffers = event.checked;
  }

  onUpdateService(): boolean | void {
    this.logger.info(this.selNode);
    this.selNode.settings.enableOffers = this.enableOffers;
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
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
