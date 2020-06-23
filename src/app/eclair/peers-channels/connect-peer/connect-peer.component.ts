import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Peer } from '../../../shared/models/eclrModels';
import { ECLROpenChannelAlert } from '../../../shared/models/alertData';
import { FEE_RATE_TYPES } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLREffects } from '../../store/eclr.effects';
import * as ECLRActions from '../../store/eclr.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-eclr-connect-peer',
  templateUrl: './connect-peer.component.html',
  styleUrls: ['./connect-peer.component.scss']
})
export class ECLRConnectPeerComponent implements OnInit, OnDestroy {
  @ViewChild('peersForm', {static: true}) form: any;
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faExclamationTriangle = faExclamationTriangle;
  public peerAddress = '';
  public totalBalance = 0;
  public feeRateTypes = FEE_RATE_TYPES;
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

  constructor(public dialogRef: MatDialogRef<ECLRConnectPeerComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLROpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private eclrEffects: ECLREffects, private formBuilder: FormBuilder, private actions$: Actions, private logger: LoggerService) {}

  ngOnInit() {
    this.totalBalance = this.data.message.balance;
    this.peerFormGroup = this.formBuilder.group({
      hiddenAddress: ['', [Validators.required]],
      peerAddress: ['', [Validators.required]]
    });
    this.channelFormGroup = this.formBuilder.group({
      fundingAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.totalBalance)]],
      isPrivate: [false],
      selFeeRate: [null],
      flgMinConf: [false],
      minConfValue: [null],
      hiddenAmount: ['', [Validators.required]]
    });    
    this.statusFormGroup = this.formBuilder.group({}); 
    this.channelFormGroup.controls.flgMinConf.valueChanges.pipe(takeUntil(this.unSubs[0])).subscribe(flg => {
      if (flg) {
        this.channelFormGroup.controls.selFeeRate.setValue(null);
        this.channelFormGroup.controls.selFeeRate.disable();
        this.channelFormGroup.controls.minConfValue.enable();
        this.channelFormGroup.controls.minConfValue.setValidators([Validators.required]);
      } else {
        this.channelFormGroup.controls.selFeeRate.enable();
        this.channelFormGroup.controls.minConfValue.disable();
        this.channelFormGroup.controls.minConfValue.setValidators(null);
      }
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === ECLRActions.NEWLY_ADDED_PEER_ECLR || action.type === ECLRActions.FETCH_CHANNELS_ECLR || action.type === ECLRActions.EFFECT_ERROR_ECLR))
    .subscribe((action: (ECLRActions.NewlyAddedPeer | ECLRActions.FetchChannels | ECLRActions.EffectError)) => {
      if (action.type === ECLRActions.NEWLY_ADDED_PEER_ECLR) { 
        this.logger.info(action.payload);
        this.flgEditable = false;
        this.newlyAddedPeer = action.payload.peer;
        this.peerFormGroup.controls.hiddenAddress.setValue(this.peerFormGroup.controls.peerAddress.value);
        this.stepper.next();
      }
      if (action.type === ECLRActions.FETCH_CHANNELS_ECLR) { 
        this.dialogRef.close();
      }
      if (action.type === ECLRActions.EFFECT_ERROR_ECLR) { 
        if (action.payload.action === 'SaveNewPeer') {
          this.peerConnectionError = action.payload.message;
        } else if (action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
      }
    });
  }

  onConnectPeer() {
    if(!this.peerFormGroup.controls.peerAddress.value) { return true; }
    this.peerConnectionError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new ECLRActions.SaveNewPeer({nodeId: this.peerFormGroup.controls.peerAddress.value}));
}

  onOpenChannel() {
    if (!this.channelFormGroup.controls.fundingAmount.value || ((this.totalBalance - this.channelFormGroup.controls.fundingAmount.value) < 0) || (this.channelFormGroup.controls.flgMinConf.value && !this.channelFormGroup.controls.minConfValue.value)) { return true; }
    this.channelConnectionError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new ECLRActions.SaveNewChannel({
      peerId: this.newlyAddedPeer.nodeId, satoshis: this.channelFormGroup.controls.fundingAmount.value, announce: !this.channelFormGroup.controls.isPrivate.value, feeRate: this.channelFormGroup.controls.selFeeRate.value, minconf: this.channelFormGroup.controls.flgMinConf.value ? this.channelFormGroup.controls.minConfValue.value : null
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
          this.peerFormLabel = 'Peer Added: ' + (this.newlyAddedPeer.alias ? this.newlyAddedPeer.alias : this.newlyAddedPeer.nodeId);
        } else {
          this.peerFormLabel = 'Peer Details';
        }
        this.channelFormLabel = 'Open Channel (Optional)';
        break;

      case 2:
        if (this.peerFormGroup.controls.peerAddress.value) {
          this.peerFormLabel = 'Peer Added: ' + (this.newlyAddedPeer.alias ? this.newlyAddedPeer.alias : this.newlyAddedPeer.nodeId);
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
