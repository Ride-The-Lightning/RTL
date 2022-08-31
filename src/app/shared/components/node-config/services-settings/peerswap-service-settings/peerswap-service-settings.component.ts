import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum, UI_MESSAGES } from '../../../../services/consts-enums-functions';
import { ConfigSettingsNode } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { DataService } from '../../../../services/data.service';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { updateServiceSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { setChildNodeSettingsLND } from '../../../../../lnd/store/lnd.actions';
import { setChildNodeSettingsCL } from '../../../../../cln/store/cln.actions';
import { setChildNodeSettingsECL } from '../../../../../eclair/store/ecl.actions';
import { rootSelectedNode } from '../../../../../store/rtl.selector';
import { PeerswapReloadPolicy } from '../../../../models/clnModels';


@Component({
  selector: 'rtl-peerswap-service-settings',
  templateUrl: './peerswap-service-settings.component.html',
  styleUrls: ['./peerswap-service-settings.component.scss']
})
export class PeerswapServiceSettingsComponent implements OnInit, OnDestroy {

  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: ConfigSettingsNode | any;
  public enablePeerswap = false;
  public allowSwapRequests = false;
  public reloadPolicy: PeerswapReloadPolicy | null = null;
  public reloadPolicyError = '';
  public addRemoveError = '';
  public addPeerNodeId = '';
  public unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private dataService: DataService) { }

  ngOnInit() {
    this.dataService.peerswapReloadPolicy().pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: (res) => {
          this.reloadPolicy = res;
        }, error: (err) => {
          this.reloadPolicyError = 'ERROR: ' + err;
        }
      });

    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[1])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enablePeerswap = !!selNode?.settings.enablePeerswap;
        this.logger.info(selNode);
      });
  }

  onUpdateService(): boolean | void {
    this.store.dispatch(updateServiceSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_PEERSWAP_SETTINGS, service: ServicesEnum.PEERSWAP, settings: { enablePeerswap: this.enablePeerswap } } }));
    this.store.dispatch(setChildNodeSettingsLND({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap: this.selNode.settings.enablePeerswap
      }
    }));
    this.store.dispatch(setChildNodeSettingsCL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap: this.selNode.settings.enablePeerswap
      }
    }));
    this.store.dispatch(setChildNodeSettingsECL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap: this.selNode.settings.enablePeerswap
      }
    }));
  }

  onAddPeer() {
    this.addRemoveError = '';
    this.dataService.addPeerToPeerswap(this.addPeerNodeId).pipe(takeUntil(this.unSubs[2])).
      subscribe({
        next: (res) => {
          this.reloadPolicy = res;
          this.addPeerNodeId = '';
        }, error: (err) => {
          this.addRemoveError = 'ERROR: ' + err;
          setTimeout(() => { this.addRemoveError = ''; }, 3000);
        }
      });
  }

  onRemovePeer(peerNodeId: string) {
    this.addRemoveError = '';
    this.dataService.removePeerFromPeerswap(peerNodeId).pipe(takeUntil(this.unSubs[3])).
      subscribe({
        next: (res) => {
          this.reloadPolicy = res;
        }, error: (err) => {
          this.addRemoveError = 'ERROR: ' + err;
          setTimeout(() => { this.addRemoveError = ''; }, 3000);
        }
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
