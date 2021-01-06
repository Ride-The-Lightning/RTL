import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ScreenSizeEnum } from '../../../../services/consts-enums-functions';

import { sliderAnimation } from '../../../../animation/slider-animation';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'rtl-boltz-swapin-info-graphics',
  templateUrl: './info-graphics.component.html',
  styleUrls: ['./info-graphics.component.scss'],
  animations: [sliderAnimation]  
})
export class SwapInInfoGraphicsComponent implements OnInit {
  @Input() animationDirection = 'forward';
  @Input() stepNumber = 1;
  @Output() stepNumberChange = new EventEmitter();
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private commonService: CommonService) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();    
  }

  onSwipe(event: any) {
    if(event.direction === 2 && this.stepNumber < 5) {
      this.stepNumber++;
      this.animationDirection = 'forward';
      this.stepNumberChange.emit(this.stepNumber);
    } else if(event.direction === 4 && this.stepNumber > 1) {
      this.stepNumber--;
      this.animationDirection = 'backward';
      this.stepNumberChange.emit(this.stepNumber);
    }
  }
}
