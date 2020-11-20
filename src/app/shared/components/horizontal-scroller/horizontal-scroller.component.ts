import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { sliderAnimation } from '../../../shared/animation/slider-animation';

@Component({
  selector: 'rtl-horizontal-scroller',
  templateUrl: './horizontal-scroller.component.html',
  styleUrls: ['./horizontal-scroller.component.scss'],
  animations: [sliderAnimation]  
})
export class HorizontalScrollerComponent implements OnInit {
  @Input() animationDirection = 'forward';
  @Input() showValue = 'MONTH';
  @Input() selectedValue = 1;
  @Output() stepChanged = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  onStepChange(direction: string) {
    switch (direction) {
      case 'FIRST':
        this.selectedValue = 0;
        this.animationDirection = 'backward';
        this.stepChanged.emit(this.selectedValue);
        break;
    
      case 'PREVIOUS':
        this.selectedValue--;
        this.animationDirection = 'backward';
        this.stepChanged.emit(this.selectedValue);
        break;

      case 'NEXT':
        this.selectedValue++;
        this.animationDirection = 'forward';
        this.stepChanged.emit(this.selectedValue);
        break;

      default:
        this.selectedValue = 100;
        this.animationDirection = 'forward';
        this.stepChanged.emit(this.selectedValue);
        break;
    }
    console.warn(this.selectedValue);
    console.warn(this.animationDirection);
    setTimeout(() => {
      this.animationDirection = '';
    }, 800);
  }

  onAnimationEvent( event: AnimationEvent ) {
    console.warn(event);
  }
}
