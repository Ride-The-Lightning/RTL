import { Component, OnInit, Input } from '@angular/core';
import { LoopStatus } from '../../../../models/loopModels';

@Component({
  selector: 'rtl-boltz-swap-status',
  templateUrl: './swap-status.component.html',
  styleUrls: ['./swap-status.component.scss']
})
export class SwapStatusComponent implements OnInit {
  @Input() loopStatus: LoopStatus;

  constructor() {}

  ngOnInit() {}

}
