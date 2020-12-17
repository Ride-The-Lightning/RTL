import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../shared/services/logger.service';
import { Peer } from '../../../shared/models/lndModels';
import { OpenChannelAlert } from '../../../shared/models/alertData';
import { TRANS_TYPES } from '../../../shared/services/consts-enums-functions';

import { LNDEffects } from '../../store/lnd.effects';
import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-connect-peer',
  templateUrl: './connect-peer.component.html',
  styleUrls: ['./connect-peer.component.scss']
})
export class ConnectPeerComponent implements OnInit, OnDestroy {
  @ViewChild('peersForm', {static: false}) form: any;
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public peerAddress = '';
  public totalBalance = 0;
  public transTypes = TRANS_TYPES;
  public flgChannelOpened = false;
  public channelOpenStatus = null;
  public newlyAddedPeer: Peer = null;
  public flgEditable = true;
  public peerConnectionError = '';
  public channelConnectionError = '';
  public peerFormLabel = 'Peer Details';
  public channelFormLabel = 'Open Channel (Optional)';
  peerFormGroup: FormGroup;
  channelFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ConnectPeerComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private formBuilder: FormBuilder, private actions$: Actions, private logger: LoggerService) {}

  ngOnInit() {
    this.totalBalance = this.data.message.balance;
    this.peerFormGroup = this.formBuilder.group({
      hiddenAddress: ['', [Validators.required]],
      peerAddress: ['', [Validators.required]]
    });
    this.channelFormGroup = this.formBuilder.group({
      fundingAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.totalBalance)]],
      isPrivate: [false],
      selTransType: [TRANS_TYPES[0].id],
      transTypeValue: [{value: '', disabled: true}],
      spendUnconfirmed: [false],
      hiddenAmount: ['', [Validators.required]]
    });    
    this.statusFormGroup = this.formBuilder.group({}); 
    this.channelFormGroup.controls.selTransType.valueChanges.pipe(takeUntil(this.unSubs[0])).subscribe(transType => {
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
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === LNDActions.NEWLY_ADDED_PEER_LND || action.type === LNDActions.FETCH_PENDING_CHANNELS_LND || action.type === LNDActions.EFFECT_ERROR_LND))
    .subscribe((action: (LNDActions.NewlyAddedPeer | LNDActions.FetchPendingChannels | LNDActions.EffectError)) => {
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
      if (action.type === LNDActions.EFFECT_ERROR_LND) { 
        if (action.payload.action === 'SaveNewPeer' || action.payload.action === 'FetchGraphNode') {
          this.peerConnectionError = action.payload.message;
        } else if (action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
      }
    });
  }

  onConnectPeer():boolean|void {
    if(!this.peerFormGroup.controls.peerAddress.value) { return true; }
    this.peerConnectionError = '';
    const deviderIndex = this.peerFormGroup.controls.peerAddress.value.search('@');
    let pubkey = '';
    let host = '';
    if (deviderIndex > -1) {
      pubkey = this.peerFormGroup.controls.peerAddress.value.substring(0, deviderIndex);
      host = this.peerFormGroup.controls.peerAddress.value.substring(deviderIndex + 1);
      this.connectPeerWithParams(pubkey, host);
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
      this.store.dispatch(new LNDActions.FetchGraphNode({pubkey: this.peerFormGroup.controls.peerAddress.value}));
      this.lndEffects.setGraphNode
      .pipe(take(1))
      .subscribe(graphNode => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        host = (!graphNode.node.addresses || !graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
        this.connectPeerWithParams(this.peerFormGroup.controls.peerAddress.value, host);
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new LNDActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false}));
  }

  onOpenChannel():boolean|void {
    if (!this.channelFormGroup.controls.fundingAmount.value || ((this.totalBalance - this.channelFormGroup.controls.fundingAmount.value) < 0) || (this.channelFormGroup.controls.selTransType.value === '1' && !this.channelFormGroup.controls.transTypeValue.value) || (this.channelFormGroup.controls.selTransType.value === '2' && !this.channelFormGroup.controls.transTypeValue.value)) { return true; }
    this.channelConnectionError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new LNDActions.SaveNewChannel({
      selectedPeerPubkey: this.newlyAddedPeer.pub_key, fundingAmount: this.channelFormGroup.controls.fundingAmount.value, private: this.channelFormGroup.controls.isPrivate.value,
      transType: this.channelFormGroup.controls.selTransType.value, transTypeValue: this.channelFormGroup.controls.transTypeValue.value, spendUnconfirmed: this.channelFormGroup.controls.spendUnconfirmed.value
    }));
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
          this.peerFormLabel = 'Peer Added: ' + this.newlyAddedPeer.alias;
        } else {
          this.peerFormLabel = 'Peer Details';
        }
        this.channelFormLabel = 'Open Channel (Optional)';
        break;

      case 2:
        if (this.peerFormGroup.controls.peerAddress.value) {
          this.peerFormLabel = 'Peer Added: ' + this.newlyAddedPeer.alias;
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
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
