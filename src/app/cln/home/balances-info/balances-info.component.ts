import { Component, Input } from '@angular/core';

@Component({
  selector: 'rtl-cln-balances-info',
  templateUrl: './balances-info.component.html',
  styleUrls: ['./balances-info.component.scss']
})
export class CLNBalancesInfoComponent {

  @Input() balances = { onchain: 0, lightning: 0, total: 0 };
  @Input() errorMessage: string;

  constructor() { }

}
