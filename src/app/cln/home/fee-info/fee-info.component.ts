import { Component, Input } from '@angular/core';
import { Fees } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cln-fee-info',
  templateUrl: './fee-info.component.html',
  styleUrls: ['./fee-info.component.scss']
})
export class CLNFeeInfoComponent {

  @Input() fees: Fees;
  @Input() errorMessage: string;
  totalFees = [{ name: 'Total', value: 0 }];

}
