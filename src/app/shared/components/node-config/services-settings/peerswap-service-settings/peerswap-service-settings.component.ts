import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum, UI_MESSAGES } from '../../../../services/consts-enums-functions';
import { Node } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { updateNodeSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { setChildNodeSettingsLND } from '../../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCLN } from '../../../../../cln/store/cln.actions';
import { setChildNodeSettingsECL } from '../../../../../eclair/store/ecl.actions';
import { rootSelectedNode } from '../../../../../store/rtl.selector';

@Component({
  selector: 'rtl-peerswap-service-settings',
  templateUrl: './peerswap-service-settings.component.html',
  styleUrls: ['./peerswap-service-settings.component.scss']
})
export class PeerswapServiceSettingsComponent implements OnInit, OnDestroy {

  public faInfoCircle = faInfoCircle;
  public selNode: Node | any;
  public enablePeerswap = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enablePeerswap = !!selNode?.settings.enablePeerswap;
        this.logger.info(selNode);
      });
  }

  onUpdateService(): boolean | void {
    // this.store.dispatch(updateNodeSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_PEERSWAP_SETTINGS, service: ServicesEnum.PEERSWAP, settings: { enablePeerswap: this.enablePeerswap } } }));
    // this.store.dispatch(setChildNodeSettingsLND({
    //   payload: {
    //     userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
    //     unannouncedChannels: this.selNode.settings.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap:
    //  this.selNode.settings.enablePeerswap
    //   }
    // }));
    // this.store.dispatch(setChildNodeSettingsCLN({
    //   payload: {
    //     userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
    //     unannouncedChannels: this.selNode.settings.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap:
    //  this.selNode.settings.enablePeerswap
    //   }
    // }));
    // this.store.dispatch(setChildNodeSettingsECL({
    //   payload: {
    //     userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
    //     unannouncedChannels: this.selNode.settings.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap:
    //  this.selNode.settings.enablePeerswap
    //   }
    // }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
