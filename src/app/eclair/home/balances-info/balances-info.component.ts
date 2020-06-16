import { Component, Input } from '@angular/core';

@Component({
  selector: 'rtl-eclr-balances-info',
  templateUrl: './balances-info.component.html',
  styleUrls: ['./balances-info.component.scss']
})
export class ECLRBalancesInfoComponent {
  @Input() balances = { onchain: 0, lightning: 0, total: 0 };

  constructor() {}

}
