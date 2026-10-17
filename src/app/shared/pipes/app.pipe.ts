import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: 'removeleadingzeros'
})
export class RemoveLeadingZerosPipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value?.replace(/^[0]+/g, '');
  }

}

@Pipe({
  standalone: false,
  name: 'camelcase'
})
export class CamelCasePipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' ');
  }

}

@Pipe({
  standalone: false,
  name: 'camelCaseWithSpaces'
})
export class CamelCaseWithSpacesPipe implements PipeTransform {

  transform(value: string, arg1?: string, arg2?: string): string {
    return value.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (' ' + word.toUpperCase()));
  }

}

@Pipe({
  standalone: false,
  name: 'camelcaseWithReplace'
})
export class CamelCaseWithReplacePipe implements PipeTransform {

  transform(value: string, arg1?: string, arg2?: string): string {
    value = value ? value.toLowerCase().replace(/\s+/g, '')?.replace(/-/g, ' ') : '';
    if (arg1) {
      value = value.replace(new RegExp(arg1, 'g'), ' ');
    }
    if (arg2) {
      value = value.replace(new RegExp(arg2, 'g'), ' ');
    }
    return value.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()));
  }

}

// Splits text into parts so a template can bold each amount written as 'N Sats' (for example
// '500,000 Sats'), rendering every part as text: nothing in the message is treated as markup.
@Pipe({
  standalone: false,
  name: 'satsAmountParts'
})
export class SatsAmountPartsPipe implements PipeTransform {

  transform(value: string): { text: string, isAmount: boolean }[] {
    return (value || '').split(/(?<amount>\d[\d,.]* Sats)/).filter((part) => part !== '').map((part) => ({ text: part, isAmount: (/^\d[\d,.]* Sats$/).test(part) }));
  }

}
