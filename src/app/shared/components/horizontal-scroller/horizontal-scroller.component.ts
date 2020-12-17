import { Component, Output, EventEmitter, OnInit, ViewChild, HostListener } from '@angular/core';

import { sliderAnimation } from '../../../shared/animation/slider-animation';
import { SCROLL_RANGES } from '../../services/consts-enums-functions';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'rtl-horizontal-scroller',
  templateUrl: './horizontal-scroller.component.html',
  styleUrls: ['./horizontal-scroller.component.scss'],
  animations: [sliderAnimation]
})
export class HorizontalScrollerComponent implements OnInit {
  @ViewChild('monthlyDatepicker') monthlyDatepicker;
  @ViewChild('yearlyDatepicker') yearlyDatepicker;
  public scrollRanges = SCROLL_RANGES;
  public selScrollRange = this.scrollRanges[0];
  public today = new Date(Date.now());
  public first = new Date(2018, 0, 1, 0, 0, 0);
  public last = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate(), 0, 0, 0);
  public disablePrev = false;
  public disableNext = true;
  public animationDirection = '';
  public selectedValue = this.last;
  @Output() stepChanged = new EventEmitter<{selDate:Date, selScrollRange:string}>();
  
  constructor(private logger: LoggerService) {}

  ngOnInit() {}

  onRangeChanged(event: any) {
    this.selScrollRange = event.value;
    this.onStepChange('LAST');
  }

  onMonthSelected(event: any) {
    this.selectedValue = event;
    this.onStepChange('SELECTED');
    this.monthlyDatepicker.close();
  }

  onYearSelected(event: any) {
    this.selectedValue = event;
    this.onStepChange('SELECTED');
    this.yearlyDatepicker.close();
  }

  onStepChange(direction: string) {
    this.logger.info(direction);
    switch (direction) {
      case 'FIRST':
        this.animationDirection = 'backward';
        if (this.selectedValue !== this.first) {
          this.selectedValue = this.first;
          this.stepChanged.emit({selDate: this.selectedValue, selScrollRange: this.selScrollRange});
        }
        break;
    
      case 'PREVIOUS':
        if (this.selScrollRange === SCROLL_RANGES[1]) {
          this.selectedValue = new Date(this.selectedValue.getFullYear() - 1, 0, 1, 0, 0, 0);
        } else {
          this.selectedValue = new Date(this.selectedValue.getFullYear(), this.selectedValue.getMonth() - 1, 1, 0, 0, 0);
        }
        this.animationDirection = 'backward';
        this.stepChanged.emit({selDate: this.selectedValue, selScrollRange: this.selScrollRange});
        break;

      case 'NEXT':
        if (this.selScrollRange === SCROLL_RANGES[1]) {
          this.selectedValue = new Date(this.selectedValue.getFullYear() + 1, 0, 1, 0, 0, 0);
        } else {
          this.selectedValue = new Date(this.selectedValue.getFullYear(), this.selectedValue.getMonth() + 1 , 1, 0, 0, 0);
        }
        this.animationDirection = 'forward';
        this.stepChanged.emit({selDate: this.selectedValue, selScrollRange: this.selScrollRange});
        break;

      case 'LAST':
        this.animationDirection = 'forward';
        this.selectedValue = this.last;
        this.stepChanged.emit({selDate: this.selectedValue, selScrollRange: this.selScrollRange});
        break;

      default:
        this.animationDirection = '';
        this.stepChanged.emit({selDate: this.selectedValue, selScrollRange: this.selScrollRange});
        break;
    }
    this.disablePrev = (this.selScrollRange === SCROLL_RANGES[1]) ? this.selectedValue.getFullYear() <= this.first.getFullYear() : (this.selectedValue.getFullYear() <= this.first.getFullYear() && this.selectedValue.getMonth() <= this.first.getMonth());
    this.disableNext = (this.selScrollRange === SCROLL_RANGES[1]) ? this.selectedValue.getFullYear() >= this.last.getFullYear() : (this.selectedValue.getFullYear() >= this.last.getFullYear() && this.selectedValue.getMonth() >= this.last.getMonth());
    this.logger.info(this.disablePrev);
    this.logger.info(this.disableNext);
    setTimeout(() => {
      this.animationDirection = '';
    }, 800);
  }

  @HostListener('click', ['$event']) onChartMouseUp(e) {
    if(e.srcElement.name === 'monthlyDate') {
      this.monthlyDatepicker.open();
    } else if(e.srcElement.name === 'yearlyDate') {
      this.yearlyDatepicker.open();
    }
  }

}
