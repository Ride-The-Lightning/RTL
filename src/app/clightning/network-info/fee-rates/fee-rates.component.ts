import { Component, AfterContentChecked, Input } from '@angular/core';

import { FeeRates, FeeRatePerObj, feeRateStyle } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-fee-rates',
  templateUrl: './fee-rates.component.html',
  styleUrls: ['./fee-rates.component.scss']
})
export class CLFeeRatesComponent implements AfterContentChecked {
  @Input() feeRateStyle: string;
  @Input() feeRates: FeeRates;
  @Input() flgLoading: Boolean | 'error';
  perkbw: FeeRatePerObj = {};

  constructor() { }

  ngOnInit() {}

  ngAfterContentChecked() {
    if (this.feeRateStyle === feeRateStyle.KB) {
      this.perkbw = this.feeRates.perkb;
    } else if (this.feeRateStyle === feeRateStyle.KW) {
      this.perkbw = this.feeRates.perkw;
    }
  }

}
