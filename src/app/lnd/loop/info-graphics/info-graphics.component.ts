import { Component, OnInit, Input } from '@angular/core';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';

import { opacityAnimation } from '../../../shared/animation/opacity-animation';
import { sliderAnimation } from '../../../shared/animation/slider-animation';

@Component({
  selector: 'rtl-info-graphics',
  templateUrl: './info-graphics.component.html',
  styleUrls: ['./info-graphics.component.scss'],
  animations: [opacityAnimation, sliderAnimation]  
})
export class InfoGraphicsComponent implements OnInit {
  @Input() stepNumber = 1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor() { }

  ngOnInit() {
  }

}
