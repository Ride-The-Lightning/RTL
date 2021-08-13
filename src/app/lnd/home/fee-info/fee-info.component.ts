import { Component, OnChanges, Input } from '@angular/core';
import { Fees } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-fee-info',
  templateUrl: './fee-info.component.html',
  styleUrls: ['./fee-info.component.scss']
})
export class FeeInfoComponent implements OnChanges {
  @Input() fees: Fees;
  @Input() errorMessage: string;
  totalFees = [{name: 'Monthly', value: 0}, {name: 'Weekly', value: 0}, {name: 'Daily', value: 0}];
  maxFeeValue = 100;

  constructor() {}

  ngOnChanges() {
    if(this.fees.month_fee_sum) {
      this.totalFees = [{name: 'Monthly', value: this.fees.month_fee_sum}, {name: 'Weekly', value: this.fees.week_fee_sum}, {name: 'Daily ', value: this.fees.day_fee_sum}];
      let e = Math.ceil(Math.log(this.fees.month_fee_sum + 1) / Math.LN10);
      let m = Math.pow(10, e - 1);
      this.maxFeeValue = (Math.ceil(this.fees.month_fee_sum / m) * m) / 5 || 100;
      Object.assign(this, this.totalFees);
    } else {
      this.totalFees = [{name: 'Monthly', value: 0}, {name: 'Weekly', value: 0}, {name: 'Daily', value: 0}];
      this.maxFeeValue = 100;
      Object.assign(this, this.totalFees);
    }
  }

}
