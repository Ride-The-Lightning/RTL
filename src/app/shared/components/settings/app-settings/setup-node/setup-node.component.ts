import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { ScreenSizeEnum } from '../../../../services/consts-enums-functions';

import { sliderAnimation } from '../../../../animation/slider-animation';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'rtl-setup-node',
  templateUrl: './setup-node.component.html',
  styleUrls: ['./setup-node.component.scss'],
  animations: [sliderAnimation]  
})
export class SetupNodeComponent implements OnInit {
  public animationDirection = '';
  public stepNumber = 1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private commonService: CommonService, public dialogRef: MatDialogRef<SetupNodeComponent>) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
  }

  onStepChanged(index: number) {
    this.animationDirection = index < this.stepNumber ? 'backward' : 'forward';
    this.stepNumber = index;
  }

  onSwipe(event: any) {
    if(event.direction === 2 && this.stepNumber < 5) {
      this.stepNumber++;
      this.animationDirection = 'forward';
    } else if(event.direction === 4 && this.stepNumber > 1) {
      this.stepNumber--;
      this.animationDirection = 'backward';
    }
  }

  onClose() {
    this.dialogRef.close(true);
  }
}
