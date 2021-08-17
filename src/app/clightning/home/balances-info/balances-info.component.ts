import { Component, Input } from '@angular/core';

@Component({
  selector: 'rtl-cl-balances-info',
  templateUrl: './balances-info.component.html',
  styleUrls: ['./balances-info.component.scss']
})
export class CLBalancesInfoComponent {

  @Input() balances = { onchain: 0, lightning: 0, total: 0 };
  @Input() errorMessage: string;

  constructor() {}

}
