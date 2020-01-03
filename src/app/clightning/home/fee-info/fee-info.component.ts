import { Component, OnChanges, Input } from '@angular/core';
import { FeesCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-fee-info',
  templateUrl: './fee-info.component.html',
  styleUrls: ['./fee-info.component.scss']
})
export class CLFeeInfoComponent implements OnChanges {
  @Input() fees: FeesCL;
  totalFees = [{'name': 'Total', 'value': 0}];
  maxFeeValue = 100;

  constructor() {}

  ngOnChanges() {
    if(this.fees.feeCollected) {
      this.totalFees = [{'name': 'Total', 'value': this.fees.feeCollected}];
      Object.assign(this, this.totalFees);
    }
  }

}
