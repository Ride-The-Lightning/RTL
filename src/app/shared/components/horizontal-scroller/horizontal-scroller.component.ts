import { Component, Output, EventEmitter, OnInit, Directive } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NativeDateAdapter, MatDateFormats } from '@angular/material/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';

import { sliderAnimation } from '../../../shared/animation/slider-animation';
import { MONTHS, SCROLL_RANGES } from '../../services/consts-enums-functions';

export class CustomDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'MMM YYYY') {
      return MONTHS[date.getMonth()].name + ', ' + date.getFullYear();
    } else if (displayFormat === 'YYYY') {
      return date.getFullYear().toString();
    }
  }
}

export const MONTHLY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'MMM YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY'
  }
};

export const YEARLY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'MMM YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY'
  }
};

@Directive({
  selector: '[monthlyDateFormat]',
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MONTHLY_DATE_FORMATS}
  ],
})
export class monthlyDateFormat {}

@Directive({
  selector: '[yearlyDateFormat]',
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: YEARLY_DATE_FORMATS}
  ],
})
export class yearlyDateFormat {}

@Component({
  selector: 'rtl-horizontal-scroller',
  templateUrl: './horizontal-scroller.component.html',
  styleUrls: ['./horizontal-scroller.component.scss'],
  animations: [sliderAnimation]
})
export class HorizontalScrollerComponent implements OnInit {
  public scrollRanges = SCROLL_RANGES;
  public selScrollRange = this.scrollRanges[0].range;
  public today = new Date(Date.now());
  public first = new Date(2018, 0, 1, 0, 0, 0);
  public last = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate(), 0, 0, 0);
  public disablePrev = false;
  public disableNext = true;
  public animationDirection = '';
  public selectedValue = this.last;
  date1 = new FormControl(new Date());
  date2 = new FormControl(new Date());
  @Output() stepChanged = new EventEmitter<{value: Date, animationDirection: String}>();
  
  constructor() {}

  ngOnInit() {}

  onYearSelected(event: any) {
    console.warn(event);
  }

  onMonthSelected(event: any) {
    console.warn(event);
  }

  onStepChange(direction: string) {
    switch (direction) {
      case 'FIRST':
        this.animationDirection = 'backward';
        if (this.selectedValue !== this.first) {
          this.selectedValue = this.first;
          this.stepChanged.emit({value: this.selectedValue, animationDirection: this.animationDirection});
        }
        break;
    
      case 'PREVIOUS':
        this.selectedValue = new Date(this.selectedValue.getFullYear(), this.selectedValue.getMonth() - 1, this.selectedValue.getDate(), 0, 0, 0);
        this.animationDirection = 'backward';
        this.stepChanged.emit({value: this.selectedValue, animationDirection: this.animationDirection});
        break;

      case 'NEXT':
        this.selectedValue = new Date(this.selectedValue.getFullYear(), this.selectedValue.getMonth() + 1 , this.selectedValue.getDate(), 0, 0, 0);
        this.animationDirection = 'forward';
        this.stepChanged.emit({value: this.selectedValue, animationDirection: this.animationDirection});
        break;

      default:
        this.animationDirection = 'forward';
        if (this.selectedValue !== this.last) {
          this.selectedValue = this.last;
          this.stepChanged.emit({value: this.selectedValue, animationDirection: this.animationDirection});
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
