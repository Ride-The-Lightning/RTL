import { Component, OnInit, Input } from '@angular/core';
import { LoopStatus } from '../../../../models/loopModels';

@Component({
  selector: 'rtl-loop-status',
  templateUrl: './loop-status.component.html',
  styleUrls: ['./loop-status.component.scss']
})
export class LoopStatusComponent implements OnInit {
  @Input() loopStatus: LoopStatus;

  constructor() {}

  ngOnInit() {}

}
