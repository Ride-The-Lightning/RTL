import { Component, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'rtl-balances-info',
  templateUrl: './balances-info.component.html',
  styleUrls: ['./balances-info.component.scss']
})
export class BalancesInfoComponent implements OnChanges {
  @Input() balances = { onchain: 0, lightning: 0 };

  constructor() {}

  ngOnChanges() {}

}
