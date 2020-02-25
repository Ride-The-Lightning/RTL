import { Component, OnInit } from '@angular/core';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { SwapTypeEnum } from '../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-loop',
  templateUrl: './loop.component.html',
  styleUrls: ['./loop.component.scss']
})
export class LoopComponent implements OnInit {
  faCircleNotch = faCircleNotch;
  selectedSwapType: SwapTypeEnum = SwapTypeEnum.LOOP_OUT;

  constructor() {}

  ngOnInit() {}

  onSelectedIndexChange(event: any) {
    if(event === 1) {
      this.selectedSwapType = SwapTypeEnum.LOOP_IN;
    } else {
      this.selectedSwapType = SwapTypeEnum.LOOP_OUT;
    }
  }
}
