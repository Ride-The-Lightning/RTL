import { Component, Input } from '@angular/core';

import { FeeRates } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cln-onchain-fee-estimates',
  templateUrl: './on-chain-fee-estimates.component.html',
  styleUrls: ['./on-chain-fee-estimates.component.scss']
})
export class CLNOnChainFeeEstimatesComponent {

  @Input() feeRates: FeeRates;
  @Input() errorMessage: string;

  constructor() { }

}
