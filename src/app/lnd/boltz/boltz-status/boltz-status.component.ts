import { Component, OnInit, Input } from '@angular/core';
import { LoopStatus } from '../../../shared/models/loopModels';

@Component({
  selector: 'rtl-boltz-status',
  templateUrl: './boltz-status.component.html',
  styleUrls: ['./boltz-status.component.scss']
})
export class BoltzStatusComponent implements OnInit {
  @Input() loopStatus: LoopStatus;

  constructor() {}

  ngOnInit() {}

}
