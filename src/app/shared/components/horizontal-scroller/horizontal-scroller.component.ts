import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { sliderAnimation } from '../../../shared/animation/slider-animation';

@Component({
  selector: 'rtl-horizontal-scroller',
  templateUrl: './horizontal-scroller.component.html',
  styleUrls: ['./horizontal-scroller.component.scss'],
  animations: [sliderAnimation]
})
export class HorizontalScrollerComponent implements OnInit {
  public today = new Date(Date.now());
  public first = new Date(2018, 0, 1, 0, 0, 0);
  public last = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate(), 0, 0, 0);
  public disablePrev = false;
  public disableNext = true;
  public animationDirection = '';
  public selectedValue = this.last;
  @Output() stepChanged = new EventEmitter();
  
  constructor() {}

  ngOnInit() {}

  onStepChange(direction: string) {
    switch (direction) {
      case 'FIRST':
        this.animationDirection = 'backward';
        if (this.selectedValue !== this.first) {
          this.selectedValue = this.first;
          this.stepChanged.emit(this.selectedValue);
        }
        break;
    
      case 'PREVIOUS':
        this.selectedValue = new Date(this.selectedValue.getFullYear(), this.selectedValue.getMonth() - 1, this.selectedValue.getDate(), 0, 0, 0);
        this.animationDirection = 'backward';
        this.stepChanged.emit(this.selectedValue);
        break;

      case 'NEXT':
        this.selectedValue = new Date(this.selectedValue.getFullYear(), this.selectedValue.getMonth() + 1 , this.selectedValue.getDate(), 0, 0, 0);
        this.animationDirection = 'forward';
        this.stepChanged.emit(this.selectedValue);
        break;

      default:
        this.animationDirection = 'forward';
        if (this.selectedValue !== this.last) {
          this.selectedValue = this.last;
          this.stepChanged.emit(this.selectedValue);
        }
        break;
    }
    this.disablePrev = this.selectedValue <= this.first;
    this.disableNext = this.selectedValue >= this.last;
    setTimeout(() => {
      this.animationDirection = '';
    }, 800);
  }
}
