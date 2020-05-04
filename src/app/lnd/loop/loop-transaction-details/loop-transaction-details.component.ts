import { Component, OnInit, Input } from '@angular/core';
import { SwapTransactionDetails } from '../../../shared/models/loopModels';

@Component({
  selector: 'rtl-loop-transaction-details',
  templateUrl: './loop-transaction-details.component.html',
  styleUrls: ['./loop-transaction-details.component.scss']
})
export class LoopTransactionDetailsComponent implements OnInit {
  @Input() swapTransactionDetails: SwapTransactionDetails;

  constructor() {}

  ngOnInit() {}

}
