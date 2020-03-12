import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA, MatVerticalStepper } from '@angular/material';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../shared/services/logger.service';
import { Peer } from '../../../shared/models/lndModels';
import { TRANS_TYPES } from '../../../shared/services/consts-enums-functions';

import { LNDEffects } from '../../store/lnd.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-connect-peer',
  templateUrl: './connect-peer.component.html',
  styleUrls: ['./connect-peer.component.scss']
})
export class ConnectPeerComponent implements OnInit, OnDestroy {
  @ViewChild('peersForm', {static: true}) form: any;
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
  public peerFormLabel = 'Peer Details';
  public channelFormLabel = 'Open Channel (Optional)';
  peerFormGroup: FormGroup;
  channelFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ConnectPeerComponent>, @Inject(MAT_DIALOG_DATA) public data: {}, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private formBuilder: FormBuilder, private actions$: Actions, private logger: LoggerService) {}

  ngOnInit() {
    this.peerFormGroup = this.formBuilder.group({
      hiddenAddress: ['', [Validators.required]],
      peerAddress: ['', [Validators.required]]
    });
    this.channelFormGroup = this.formBuilder.group({
      fundingAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.totalBalance)]],
      isPrivate: [false],
      selTransType: [null],
      transTypeValue: [''],
      spendUnconfirmed: [false],
      hiddenAmount: ['', [Validators.required]]
    });    
    this.statusFormGroup = this.formBuilder.group({}); 
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.NEWLY_ADDED_PEER || action.type === RTLActions.SAVE_NEW_CHANNEL))
    .subscribe((action: (RTLActions.NewlyAddedPeer | RTLActions.SaveNewChannel)) => {
      if (action.type === RTLActions.NEWLY_ADDED_PEER) { 
        if (action.payload.error) {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.peerConnectionError = typeof action.payload.error.error.error.error === 'string' ? action.payload.error.error.error.error : typeof action.payload.error.error.error === 'string' ? action.payload.error.error.error : typeof action.payload.error.error === 'string' ? action.payload.error.error : typeof action.payload.error === 'string' ? action.payload.error : 'Peer Connection Failed.';
        } else {
          this.logger.info(action.payload);
          this.newlyAddedPeer = action.payload.peer;
          this.totalBalance = action.payload.balance;
          this.flgEditable = false;        
          this.peerFormGroup.controls.hiddenAddress.setValue(this.peerFormGroup.controls.peerAddress.value);
          this.stepper.next();
        }
      }
    });
  }

  onConnectPeer() {
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
      pubkey = this.peerFormGroup.controls.peerAddress.value;
      this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
      this.store.dispatch(new RTLActions.FetchGraphNode({pubkey: pubkey}));
      this.lndEffects.setGraphNode
      .pipe(take(1))
      .subscribe(graphNode => {
        if (graphNode.error) {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.peerConnectionError = typeof graphNode.error.error.error.error === 'string' ? graphNode.error.error.error.error : typeof graphNode.error.error.error === 'string' ? graphNode.error.error.error : typeof graphNode.error.error === 'string' ? graphNode.error.error : typeof graphNode.error === 'string' ? graphNode.error : 'Peer Connection Failed.';
        } else {
          host = (!graphNode.node.addresses || !graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
          this.connectPeerWithParams(pubkey, host);
        }
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false}));
  }

  onOpenChannel() {
    this.flgEditable = false;

    // const peerToAddChannelMessage = {
    //   peer: peerToAddChannel, 
    //   information: this.information,
    //   balance: this.availableBalance
    // };
    // this.store.dispatch(new RTLActions.OpenAlert({ data: { 
    //   alertTitle: 'Open Channel',
    //   message: peerToAddChannelMessage,
    //   newlyAdded: false,
    //   component: OpenChannelComponent
    // }}));
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
