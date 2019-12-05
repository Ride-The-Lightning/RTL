import { Component, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'rtl-balances-info',
  templateUrl: './balances-info.component.html',
  styleUrls: ['./balances-info.component.scss']
})
export class BalancesInfoComponent implements OnChanges {
  @Input() balances = { onchain: 0, lightning: 0 };
  @Input() flgInfoUpdate = false;
  flgBalanceUpdated = false;
  totalBalances = [{'name': 'Lightning', 'value': 0}, {'name': 'On-chain', 'value': 0}];
  maxBalanceValue = 0;
  xAxisLabel = 'Balance';

  constructor() {}

  ngOnChanges() {
    this.totalBalances = [{'name': 'Lightning', 'value': this.balances.lightning}, {'name': 'On-chain', 'value': this.balances.onchain}];
    this.maxBalanceValue = (this.balances.lightning > this.balances.onchain) ? this.balances.lightning : this.balances.onchain;
    Object.assign(this, this.totalBalances);
  }

}
