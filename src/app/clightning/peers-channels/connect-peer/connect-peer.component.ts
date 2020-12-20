import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../shared/services/logger.service';
import { Peer } from '../../../shared/models/clModels';
import { CLOpenChannelAlert } from '../../../shared/models/alertData';
import { FEE_RATE_TYPES } from '../../../shared/services/consts-enums-functions';

import { CLEffects } from '../../store/cl.effects';
import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-connect-peer',
  templateUrl: './connect-peer.component.html',
  styleUrls: ['./connect-peer.component.scss']
})
export class CLConnectPeerComponent implements OnInit, OnDestroy {
  @ViewChild('peersForm', {static: false}) form: any;
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

  constructor(public dialogRef: MatDialogRef<CLConnectPeerComponent>, @Inject(MAT_DIALOG_DATA) public data: CLOpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private clEffects: CLEffects, private formBuilder: FormBuilder, private actions$: Actions, private logger: LoggerService) {}

  ngOnInit() {
    this.totalBalance = this.data.message.balance;
    this.peerAddress = (this.data.message.peer && this.data.message.peer.id && this.data.message.peer.netaddr) ? (this.data.message.peer.id + '@' + this.data.message.peer.netaddr) : 
    (this.data.message.peer && this.data.message.peer.id && !this.data.message.peer.netaddr) ? this.data.message.peer.id : '';
    this.peerFormGroup = this.formBuilder.group({
      hiddenAddress: ['', [Validators.required]],
      peerAddress: [this.peerAddress, [Validators.required]]
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
    filter((action) => action.type === CLActions.NEWLY_ADDED_PEER_CL || action.type === CLActions.FETCH_CHANNELS_CL || action.type === CLActions.EFFECT_ERROR_CL))
    .subscribe((action: (CLActions.NewlyAddedPeer | CLActions.FetchChannels | CLActions.EffectError)) => {
      if (action.type === CLActions.NEWLY_ADDED_PEER_CL) { 
        this.logger.info(action.payload);
        this.flgEditable = false;
        this.newlyAddedPeer = action.payload.peer;
        this.peerFormGroup.controls.hiddenAddress.setValue(this.peerFormGroup.controls.peerAddress.value);
        this.stepper.next();
      }
      if (action.type === CLActions.FETCH_CHANNELS_CL) { 
        this.dialogRef.close();
      }
      if (action.type === CLActions.EFFECT_ERROR_CL) { 
        if (action.payload.action === 'SaveNewPeer') {
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
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new CLActions.SaveNewPeer({id: this.peerFormGroup.controls.peerAddress.value}));
}

  onOpenChannel():boolean|void {
    if (!this.channelFormGroup.controls.fundingAmount.value || ((this.totalBalance - this.channelFormGroup.controls.fundingAmount.value) < 0) || (this.channelFormGroup.controls.flgMinConf.value && !this.channelFormGroup.controls.minConfValue.value)) { return true; }
    this.channelConnectionError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new CLActions.SaveNewChannel({
      peerId: this.newlyAddedPeer.id, satoshis: this.channelFormGroup.controls.fundingAmount.value, announce: !this.channelFormGroup.controls.isPrivate.value, feeRate: this.channelFormGroup.controls.selFeeRate.value, minconf: this.channelFormGroup.controls.flgMinConf.value ? this.channelFormGroup.controls.minConfValue.value : null
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
          this.peerFormLabel = 'Peer Added: ' + (this.newlyAddedPeer.alias ? this.newlyAddedPeer.alias : this.newlyAddedPeer.id);
        } else {
          this.peerFormLabel = 'Peer Details';
        }
        this.channelFormLabel = 'Open Channel (Optional)';
        break;

      case 2:
        if (this.peerFormGroup.controls.peerAddress.value) {
          this.peerFormLabel = 'Peer Added: ' + (this.newlyAddedPeer.alias ? this.newlyAddedPeer.alias : this.newlyAddedPeer.id);
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
