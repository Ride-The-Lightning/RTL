import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServicesEnum, UI_MESSAGES, PeerswapPeersLists, APICallStatusEnum } from '../../../../services/consts-enums-functions';
import { ConfigSettingsNode } from '../../../../models/RTLconfig';
import { LoggerService } from '../../../../services/logger.service';
import { DataService } from '../../../../services/data.service';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { updateServiceSettings } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { setChildNodeSettingsLND } from '../../../../../lnd/store/lnd.actions';
import { fetchPSPolicy, setChildNodeSettingsCL } from '../../../../../cln/store/cln.actions';
import { setChildNodeSettingsECL } from '../../../../../eclair/store/ecl.actions';
import { rootSelectedNode } from '../../../../../store/rtl.selector';
import { PeerswapPolicy } from '../../../../models/peerswapModels';
import { psPolicy } from 'src/app/cln/store/cln.selector';
import { ApiCallStatusPayload } from 'src/app/shared/models/apiCallsPayload';


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
  public psPolicy: PeerswapPolicy = { min_swap_amount_msat: 100000000 };
  public peerswapPeersLists = PeerswapPeersLists;
  public errorMessage = '';
  public dataForAllowedList = { icon: 'check', class: 'green', title: 'whitelisted peers', dataSource: 'allowlisted_peers', list: PeerswapPeersLists.ALLOWED, ngModelVar: '', addRemoveError: '' };
  public dataForSuspiciousList = { icon: 'close', class: 'red', title: 'suspicious peers', dataSource: 'suspicious_peers', list: PeerswapPeersLists.SUSPICIOUS, ngModelVar: '', addRemoveError: '' };
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  public unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private dataService: DataService) { }

  ngOnInit() {
    this.store.select(rootSelectedNode).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.enablePeerswap = !!selNode?.settings.enablePeerswap;
        this.logger.info(selNode);
      });
    this.store.select(psPolicy).pipe(takeUntil(this.unSubs[1])).subscribe((policySeletor: { policy: PeerswapPolicy, apiCallStatus: ApiCallStatusPayload }) => {
      this.errorMessage = '';
      this.apiCallStatus = policySeletor.apiCallStatus;
      if (this.apiCallStatus?.status === APICallStatusEnum.UN_INITIATED) {
        this.store.dispatch(fetchPSPolicy());
      }
      if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
        this.errorMessage = 'ERROR: ' + (!this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message);
      }
      this.psPolicy = policySeletor.policy;
      this.logger.info(policySeletor);
    });
  }

  onUpdateService(): boolean | void {
    this.store.dispatch(updateServiceSettings({ payload: { uiMessage: UI_MESSAGES.UPDATE_PEERSWAP_SETTINGS, service: ServicesEnum.PEERSWAP, settings: { enablePeerswap: this.enablePeerswap } } }));
    this.store.dispatch(setChildNodeSettingsLND({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        unannouncedChannels: this.selNode.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap: this.selNode.settings.enablePeerswap
      }
    }));
    this.store.dispatch(setChildNodeSettingsCL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        unannouncedChannels: this.selNode.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap: this.selNode.settings.enablePeerswap
      }
    }));
    this.store.dispatch(setChildNodeSettingsECL({
      payload: {
        userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion,
        unannouncedChannels: this.selNode.unannouncedChannels, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl, enableOffers: this.selNode.settings.enableOffers, enablePeerswap: this.selNode.settings.enablePeerswap
      }
    }));
  }

  onAddPeer(ngModelVar: string, list: PeerswapPeersLists) {
    if (list !== PeerswapPeersLists.ALLOWED) {
      this.dataForSuspiciousList.addRemoveError = '';
    } else {
      this.dataForAllowedList.addRemoveError = '';
    }
    this.dataService.addPeerToPeerswap(ngModelVar, list).pipe(takeUntil(this.unSubs[2])).
      subscribe({
        next: (res: PeerswapPolicy) => {
          this.psPolicy = res || { min_swap_amount_msat: 100000000 };
          if (list !== PeerswapPeersLists.ALLOWED) {
            this.dataForSuspiciousList.ngModelVar = '';
          } else {
            this.dataForAllowedList.ngModelVar = '';
          }
        }, error: (err) => {
          if (list !== PeerswapPeersLists.ALLOWED) {
            this.dataForSuspiciousList.addRemoveError = 'ERROR: ' + err;
          } else {
            this.dataForAllowedList.addRemoveError = 'ERROR: ' + err;
          }
          setTimeout(() => {
            if (list !== PeerswapPeersLists.ALLOWED) {
              this.dataForSuspiciousList.addRemoveError = '';
            } else {
              this.dataForAllowedList.addRemoveError = '';
            }
          }, 3000);
        }
      });
  }

  onRemovePeer(peerNodeId: string, list: PeerswapPeersLists) {
    if (list !== PeerswapPeersLists.ALLOWED) {
      this.dataForSuspiciousList.addRemoveError = '';
    } else {
      this.dataForAllowedList.addRemoveError = '';
    }
    this.dataService.removePeerFromPeerswap(peerNodeId, list).pipe(takeUntil(this.unSubs[3])).
      subscribe({
        next: (res: PeerswapPolicy) => {
          this.psPolicy = res || { min_swap_amount_msat: 100000000 };
        }, error: (err) => {
          if (list !== PeerswapPeersLists.ALLOWED) {
            this.dataForSuspiciousList.addRemoveError = 'ERROR: ' + err;
          } else {
            this.dataForAllowedList.addRemoveError = 'ERROR: ' + err;
          }
          setTimeout(() => {
            if (list !== PeerswapPeersLists.ALLOWED) {
              this.dataForSuspiciousList.addRemoveError = '';
            } else {
              this.dataForAllowedList.addRemoveError = '';
            }
          }, 3000);
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
