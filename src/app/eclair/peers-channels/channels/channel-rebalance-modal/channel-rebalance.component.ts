import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { ECLChannelRebalanceAlert } from '../../../../shared/models/alertData';
import { Channel, GetInfo } from '../../../../shared/models/eclModels';

import { opacityAnimation } from '../../../../shared/animation/opacity-animation';
import { DataService } from '../../../../shared/services/data.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { RTLState } from '../../../../store/rtl.state';
import { fetchChannels } from '../../../store/ecl.actions';

@Component({
  selector: 'rtl-ecl-channel-rebalance',
  templateUrl: './channel-rebalance.component.html',
  styleUrls: ['./channel-rebalance.component.scss'],
  animations: [opacityAnimation]
})
export class ECLChannelRebalanceComponent implements OnInit, OnDestroy {

  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  public faInfoCircle = faInfoCircle;
  public information: GetInfo = {};
  public selChannel: Channel = {};
  public activeChannels: Channel[] = [];
  public filteredActiveChannels: Observable<Channel[]>;
  public rebalanceStatus: { flgReusingInvoice: boolean, invoice: string, paymentRoute: string, paymentHash: string, paymentDetails: any, paymentStatus: any } =
    { flgReusingInvoice: false, invoice: '', paymentRoute: '', paymentHash: '', paymentDetails: null, paymentStatus: null };
  public inputFormLabel = 'Amount to rebalance';
  public flgEditable = true;
  public flgShowInfo = false;
  public stepNumber = 1;
  public animationDirection = 'forward';
  inputFormGroup: FormGroup;
  statusFormGroup: FormGroup;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(
    public dialogRef: MatDialogRef<ECLChannelRebalanceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ECLChannelRebalanceAlert,
    private logger: LoggerService,
    private dataService: DataService,
    private formBuilder: FormBuilder,
    private store: Store<RTLState>,
    private decimalPipe: DecimalPipe) { }

  ngOnInit() {
    let x = '';
    let y = '';
    this.information = this.data.message?.information || {};
    this.selChannel = this.data.message?.selChannel || {};
    this.activeChannels = this.data.message?.channels?.filter((channel) => channel.channelId !== this.selChannel.channelId && channel.toRemote && channel.toRemote > 0) || [];
    this.activeChannels = this.activeChannels.sort((c1: Channel, c2: Channel) => {
      x = c1.alias ? c1.alias.toLowerCase() : c1.shortChannelId ? c1.shortChannelId.toLowerCase() : '';
      y = c2.alias ? c2.alias.toLowerCase() : c1.shortChannelId ? c1.shortChannelId.toLowerCase() : '';
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.inputFormGroup = this.formBuilder.group({
      rebalanceAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.selChannel.toLocal || 0)]],
      selRebalancePeer: [null, Validators.required]
    });
    this.statusFormGroup = this.formBuilder.group({});
    this.inputFormGroup.get('rebalanceAmount')?.valueChanges.pipe(
      takeUntil(this.unSubs[0]), startWith(0)).
      subscribe((amount) => {
        this.inputFormGroup.controls.selRebalancePeer.setValue('');
        this.inputFormGroup.controls.selRebalancePeer.setErrors(null);
        this.filteredActiveChannels = of(amount ? this.filterActiveChannels() : this.activeChannels.slice());
      });
    this.inputFormGroup.get('selRebalancePeer')?.valueChanges.pipe(
      takeUntil(this.unSubs[1]), startWith('')).
      subscribe((alias) => {
        if (typeof alias === 'string') {
          this.filteredActiveChannels = of(this.filterActiveChannels());
        }
      });
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Amount to rebalance';
        break;

      case 1:
        if (this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.selRebalancePeer.value.alias) {
          this.inputFormLabel = 'Rebalancing Amount: ' +
            (this.decimalPipe.transform(this.inputFormGroup.controls.rebalanceAmount.value ? this.inputFormGroup.controls.rebalanceAmount.value : 0)) +
            ' Sats | Peer: ' + (this.inputFormGroup.controls.selRebalancePeer.value.alias ? this.inputFormGroup.controls.selRebalancePeer.value.alias :
            (this.inputFormGroup.controls.selRebalancePeer.value.nodeId.substring(0, 15) + '...'));
        } else {
          this.inputFormLabel = 'Amount to rebalance';
        }
        break;

      default:
        this.inputFormLabel = 'Amount to rebalance';
        break;
    }
  }

  onRebalance(): boolean | void {
    if (!this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.rebalanceAmount.value <= 0 ||
      (this.selChannel.toLocal && this.inputFormGroup.controls.rebalanceAmount.value > +this.selChannel.toLocal) ||
      !this.inputFormGroup.controls.selRebalancePeer.value.nodeId) {
      if (!this.inputFormGroup.controls.selRebalancePeer.value.nodeId) {
        this.inputFormGroup.controls.selRebalancePeer.setErrors({ required: true });
      }
      return true;
    }
    this.stepper.next();
    this.flgEditable = false;
    this.rebalanceStatus = { flgReusingInvoice: false, invoice: '', paymentRoute: '', paymentHash: '', paymentDetails: null, paymentStatus: null };
    this.dataService.circularRebalance((this.inputFormGroup.controls.rebalanceAmount.value * 1000), this.selChannel.shortChannelId, this.selChannel.nodeId, this.inputFormGroup.controls.selRebalancePeer.value.shortChannelId, this.inputFormGroup.controls.selRebalancePeer.value.nodeId, [this.information.nodeId || '']).
      pipe(takeUntil(this.unSubs[2])).subscribe({
        next: (rebalanceRes) => {
          this.logger.info(rebalanceRes);
          this.rebalanceStatus = rebalanceRes;
          this.flgEditable = true;
          this.store.dispatch(fetchChannels());
        }, error: (error) => {
          this.logger.error(error);
          this.rebalanceStatus = error;
          this.flgEditable = true;
        }
      });
  }

  filterActiveChannels() {
    return this.activeChannels?.filter((channel) => channel.toRemote && channel.toRemote >= this.inputFormGroup.controls.rebalanceAmount.value &&
      channel.channelId !== this.selChannel.channelId && ((channel.alias?.toLowerCase().indexOf(this.inputFormGroup.controls.selRebalancePeer.value ? this.inputFormGroup.controls.selRebalancePeer.value.toLowerCase() : '') === 0) ||
      (channel.channelId?.toLowerCase().indexOf(this.inputFormGroup.controls.selRebalancePeer.value ? this.inputFormGroup.controls.selRebalancePeer.value.toLowerCase() : '') === 0)));
  }

  onSelectedPeerChanged() {
    if (this.inputFormGroup.controls.selRebalancePeer.value && this.inputFormGroup.controls.selRebalancePeer.value.length > 0 && typeof this.inputFormGroup.controls.selRebalancePeer.value === 'string') {
      const foundChannels = this.activeChannels?.filter((channel) => channel.alias?.length === this.inputFormGroup.controls.selRebalancePeer.value.length &&
        channel.alias?.toLowerCase().indexOf(this.inputFormGroup.controls.selRebalancePeer.value ? this.inputFormGroup.controls.selRebalancePeer.value.toLowerCase() : '') === 0);
      if (foundChannels && foundChannels.length > 0) {
        this.inputFormGroup.controls.selRebalancePeer.setValue(foundChannels[0]);
        this.inputFormGroup.controls.selRebalancePeer.setErrors(null);
      } else {
        this.inputFormGroup.controls.selRebalancePeer.setErrors({ notfound: true });
      }
    }
  }

  displayFn(channel: Channel): string {
    return (channel && channel.alias) ? channel.alias : (channel && channel.shortChannelId) ? channel.shortChannelId : '';
  }

  showInfo() {
    this.flgShowInfo = true;
  }

  onStepChanged(index: number) {
    this.animationDirection = index < this.stepNumber ? 'backward' : 'forward';
    this.stepNumber = index;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onRestart() {
    this.flgEditable = true;
    this.stepper.reset();
    this.inputFormGroup.reset();
    this.statusFormGroup.reset();
    this.inputFormGroup.controls.rebalanceAmount.setValue('');
    this.inputFormGroup.controls.rebalanceAmount.setErrors(null);
    this.inputFormGroup.controls.selRebalancePeer.setValue('');
    this.inputFormGroup.controls.selRebalancePeer.setErrors(null);
    this.filteredActiveChannels = of(this.activeChannels);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
