import { Directive, Injectable } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter, MatDateFormats } from '@angular/material/core';
import { MONTHS } from '../services/consts-enums-functions';

@Injectable() class CustomDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'MMM YYYY') {
      return MONTHS[date.getMonth()].name + ', ' + date.getFullYear();
    } else if (displayFormat === 'YYYY') {
      return date.getFullYear().toString();
    } else {
      return date.getDate() + '/' + MONTHS[date.getMonth()].name + '/' + date.getFullYear();
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
    dateInput: 'YYYY',
    monthYearLabel: 'YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY'
  }
};

@Directive({
  selector: '[monthlyDate]',
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MONTHLY_DATE_FORMATS}
  ],
})
export class MonthlyDateDirective {}

@Directive({
  selector: '[yearlyDate]',
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: YEARLY_DATE_FORMATS}
  ],
})
export class YearlyDateDirective {}
