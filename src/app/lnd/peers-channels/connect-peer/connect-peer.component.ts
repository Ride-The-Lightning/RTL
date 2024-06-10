import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil, filter, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../shared/services/logger.service';
import { GetInfo, Peer } from '../../../shared/models/lndModels';
import { OpenChannelAlert } from '../../../shared/models/alertData';
import { APICallStatusEnum, LNDActions, TRANS_TYPES } from '../../../shared/services/consts-enums-functions';

import { RecommendedFeeRates } from '../../../shared/models/rtlModels';
import { LNDEffects } from '../../store/lnd.effects';
import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode } from '../../../store/rtl.selector';
import { fetchGraphNode, saveNewChannel, saveNewPeer } from '../../store/lnd.actions';
import { nodeInfoAndAPIStatus } from '../../store/lnd.selector';
import { Node } from '../../../shared/models/RTLconfig';
import { DataService } from '../../../shared/services/data.service';
import { CommonService } from '../../../shared/services/common.service';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-connect-peer',
  templateUrl: './connect-peer.component.html',
  styleUrls: ['./connect-peer.component.scss']
})
export class ConnectPeerComponent implements OnInit, OnDestroy {

  @ViewChild('peersForm', { static: false }) form: any;
  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public faInfoCircle = faInfoCircle;
  public selNode: Node | null;
  public peerAddress = '';
  public totalBalance = 0;
  public transTypes = TRANS_TYPES;
  public flgChannelOpened = false;
  public channelOpenStatus = null;
  public newlyAddedPeer: Peer | null = null;
  public flgEditable = true;
  public isTaprootAvailable = false;
  public peerConnectionError = '';
  public channelConnectionError = '';
  public peerFormLabel = 'Peer Details';
  public channelFormLabel = 'Open Channel (Optional)';
  public recommendedFee: RecommendedFeeRates = { fastestFee: 0, halfHourFee: 0, hourFee: 0 };
  peerFormGroup: UntypedFormGroup;
  channelFormGroup: UntypedFormGroup;
  statusFormGroup: UntypedFormGroup;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ConnectPeerComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert,
    private store: Store<RTLState>, private lndEffects: LNDEffects, private formBuilder: UntypedFormBuilder,
    private actions: Actions, private logger: LoggerService, private commonService: CommonService, private dataService: DataService) { }

  ngOnInit() {
    this.totalBalance = this.data.message?.balance || 0;
    const pAddr = this.data.message?.peer?.pub_key ? (this.data.message?.peer?.pub_key + (this.data.message?.peer?.address ? ('@' + this.data.message?.peer?.address) : '')) : '';
    this.peerFormGroup = this.formBuilder.group({
      hiddenAddress: ['', [Validators.required]],
      peerAddress: [pAddr, [Validators.required]]
    });
    this.channelFormGroup = this.formBuilder.group({
      fundingAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.totalBalance)]],
      isPrivate: [!!this.selNode?.settings.unannouncedChannels],
      selTransType: [TRANS_TYPES[0].id],
      transTypeValue: [{ value: '', disabled: true }],
      taprootChannel: [false],
      spendUnconfirmed: [false],
      hiddenAmount: ['', [Validators.required]]
    });
    this.statusFormGroup = this.formBuilder.group({});
    this.store.select(nodeInfoAndAPIStatus).pipe(takeUntil(this.unSubs[0]),
      withLatestFrom(this.store.select(rootSelectedNode))).
      subscribe(([infoStatusSelector, nodeSettings]: [{ information: GetInfo | null, apiCallStatus: ApiCallStatusPayload }, nodeSettings: Node]) => {
        this.selNode = nodeSettings;
        this.channelFormGroup.controls.isPrivate.setValue(!!nodeSettings?.settings.unannouncedChannels);
        this.isTaprootAvailable = this.commonService.isVersionCompatible(infoStatusSelector.information.version, '0.17.0');
      });
    this.channelFormGroup.controls.selTransType.valueChanges.pipe(takeUntil(this.unSubs[1])).subscribe((transType) => {
      if (transType === TRANS_TYPES[0].id) {
        this.channelFormGroup.controls.transTypeValue.setValue('');
        this.channelFormGroup.controls.transTypeValue.disable();
        this.channelFormGroup.controls.transTypeValue.setValidators(null);
        this.channelFormGroup.controls.transTypeValue.setErrors(null);
      } else {
        this.channelFormGroup.controls.transTypeValue.setValue('');
        this.channelFormGroup.controls.transTypeValue.enable();
        this.channelFormGroup.controls.transTypeValue.setValidators([Validators.required]);
      }
    });
    this.actions.pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === LNDActions.NEWLY_ADDED_PEER_LND || action.type === LNDActions.FETCH_PENDING_CHANNELS_LND || action.type === LNDActions.UPDATE_API_CALL_STATUS_LND)).
      subscribe((action: any) => {
        if (action.type === LNDActions.NEWLY_ADDED_PEER_LND) {
          this.logger.info(action.payload);
          this.flgEditable = false;
          this.newlyAddedPeer = action.payload.peer;
          this.peerFormGroup.controls.hiddenAddress.setValue(this.peerFormGroup.controls.peerAddress.value);
          this.stepper.next();
        }
        if (action.type === LNDActions.FETCH_PENDING_CHANNELS_LND) {
          this.dialogRef.close();
        }
        if (action.type === LNDActions.UPDATE_API_CALL_STATUS_LND && action.payload.status === APICallStatusEnum.ERROR) {
          if (action.payload.action === 'SaveNewPeer' || action.payload.action === 'FetchGraphNode') {
            this.peerConnectionError = action.payload.message;
          } else if (action.payload.action === 'SaveNewChannel') {
            this.channelConnectionError = action.payload.message;
          }
        }
      });
  }

  onConnectPeer(): boolean | void {
    if (!this.peerFormGroup.controls.peerAddress.value) {
      return true;
    }
    this.peerConnectionError = '';
    const deviderIndex = this.peerFormGroup.controls.peerAddress.value.search('@');
    let pubkey = '';
    let host = '';
    if (deviderIndex > -1) {
      pubkey = this.peerFormGroup.controls.peerAddress.value.substring(0, deviderIndex);
      host = this.peerFormGroup.controls.peerAddress.value.substring(deviderIndex + 1);
      this.connectPeerWithParams(pubkey, host);
    } else {
      this.store.dispatch(fetchGraphNode({ payload: { pubkey: this.peerFormGroup.controls.peerAddress.value } }));
      this.lndEffects.setGraphNode.pipe(take(1)).subscribe((graphNode) => {
        setTimeout(() => {
          host = (graphNode.node.addresses && graphNode.node.addresses.length && graphNode.node.addresses.length > 0 && graphNode.node.addresses[0].addr) ? graphNode.node.addresses[0].addr : '';
          this.connectPeerWithParams(this.peerFormGroup.controls.peerAddress.value, host);
        }, 0);
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.store.dispatch(saveNewPeer({ payload: { pubkey: pubkey, host: host, perm: false } }));
  }

  onOpenChannel(): boolean | void {
    if (this.channelFormGroup.controls.selTransType.value === '2' && this.recommendedFee.minimumFee > this.channelFormGroup.controls.transTypeValue.value) {
      this.channelFormGroup.controls.transTypeValue.setErrors({ minimum: true });
      return true;
    }
    if (
      !this.channelFormGroup.controls.fundingAmount.value ||
      ((this.totalBalance - this.channelFormGroup.controls.fundingAmount.value) < 0) ||
      (this.channelFormGroup.controls.selTransType.value === '1' && !this.channelFormGroup.controls.transTypeValue.value) ||
      (this.channelFormGroup.controls.selTransType.value === '2' && !this.channelFormGroup.controls.transTypeValue.value)
    ) {
      return true;
    }
    this.channelConnectionError = '';
    // Taproot channel's commitment type is 5
    this.store.dispatch(saveNewChannel({
      payload: {
        selectedPeerPubkey: this.newlyAddedPeer?.pub_key!, fundingAmount: this.channelFormGroup.controls.fundingAmount.value, private: this.channelFormGroup.controls.isPrivate.value,
        transType: this.channelFormGroup.controls.selTransType.value, transTypeValue: this.channelFormGroup.controls.transTypeValue.value, spendUnconfirmed: this.channelFormGroup.controls.spendUnconfirmed.value, commitmentType: (!!this.channelFormGroup.controls.taprootChannel.value ? 5 : null)
      }
    }));
  }

  onSelTransTypeChanged(event) {
    this.channelFormGroup.controls.transTypeValue.setValue('');
    if (event.value === this.transTypes[2].id) {
      this.dataService.getRecommendedFeeRates().pipe(takeUntil(this.unSubs[3])).subscribe({
        next: (rfRes: RecommendedFeeRates) => {
          this.recommendedFee = rfRes;
        }, error: (err) => {
          this.logger.error(err);
        }
      });
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.peerFormLabel = 'Peer Details';
        this.channelFormLabel = 'Open Channel (Optional)';
        break;

      case 1:
        if (this.peerFormGroup.controls.peerAddress.value) {
          this.peerFormLabel = 'Peer Added: ' + this.newlyAddedPeer?.alias;
        } else {
          this.peerFormLabel = 'Peer Details';
        }
        this.channelFormLabel = 'Open Channel (Optional)';
        break;

      case 2:
        if (this.peerFormGroup.controls.peerAddress.value) {
          this.peerFormLabel = 'Peer Added: ' + this.newlyAddedPeer?.alias;
        } else {
          this.peerFormLabel = 'Peer Details';
        }
        if (this.channelFormGroup.controls.fundingAmount.value) {
          this.channelFormLabel = 'Opening Channel for ' + this.channelFormGroup.controls.fundingAmount.value + ' Sats';
        } else {
          this.channelFormLabel = 'Open Channel (Optional)';
        }
        break;

      default:
        this.peerFormLabel = 'Peer Details';
        this.channelFormLabel = 'Open Channel (Optional)';
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      if (event.selectedIndex === 0) {
        this.peerFormGroup.controls.hiddenAddress.setValue('');
      } else if (event.selectedIndex === 1) {
        this.channelFormGroup.controls.hiddenAmount.setValue('');
      }
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
