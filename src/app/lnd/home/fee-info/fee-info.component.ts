import { Component, OnChanges, Input } from '@angular/core';
import { Fees } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-fee-info',
  templateUrl: './fee-info.component.html',
  styleUrls: ['./fee-info.component.scss']
})
export class FeeInfoComponent implements OnChanges {
  @Input() fees: Fees;

  constructor() {}

  ngOnChanges() {}

}
