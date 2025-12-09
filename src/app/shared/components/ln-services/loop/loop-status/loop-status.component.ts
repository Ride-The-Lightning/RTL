import { Component, Input } from '@angular/core';
import { LoopStatus } from '../../../../models/loopModels';

@Component({
  standalone: false,
  selector: 'rtl-loop-status',
  templateUrl: './loop-status.component.html',
  styleUrls: ['./loop-status.component.scss']
})
export class LoopStatusComponent {

  @Input() loopStatus: LoopStatus;

  constructor() {}

}
