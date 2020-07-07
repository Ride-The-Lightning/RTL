import { Component, Input } from '@angular/core';
import { Fees } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-fee-info',
  templateUrl: './fee-info.component.html',
  styleUrls: ['./fee-info.component.scss']
})
export class CLFeeInfoComponent {
  @Input() fees: Fees;
  totalFees = [{'name': 'Total', 'value': 0}];

}
