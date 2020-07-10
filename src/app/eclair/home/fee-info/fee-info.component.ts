import { Component, Input } from '@angular/core';
import { Fees } from '../../../shared/models/eclModels';

@Component({
  selector: 'rtl-ecl-fee-info',
  templateUrl: './fee-info.component.html',
  styleUrls: ['./fee-info.component.scss']
})
export class ECLFeeInfoComponent {
  @Input() fees: Fees;
  totalFees = [{'name': 'Monthly', 'value': 0}, {'name': 'Weekly', 'value': 0}, {'name': 'Daily', 'value': 0}];
  maxFeeValue = 100;

  constructor() {}

  ngOnChanges() {
    if(this.fees.monthly_fee) {
      this.totalFees = [{'name': 'Monthly', 'value': this.fees.monthly_fee}, {'name': 'Weekly', 'value': this.fees.weekly_fee}, {'name': 'Daily ', 'value': this.fees.daily_fee}];
      let e = Math.ceil(Math.log(this.fees.monthly_fee + 1) / Math.LN10);
      let m = Math.pow(10, e - 1);
      this.maxFeeValue = (Math.ceil(this.fees.monthly_fee / m) * m) / 5 || 100;
      Object.assign(this, this.totalFees);
    } else {
      this.totalFees = [{'name': 'Monthly', 'value': 0}, {'name': 'Weekly', 'value': 0}, {'name': 'Daily', 'value': 0}];
      this.maxFeeValue = 100;
      Object.assign(this, this.totalFees);
    }
  }

}
