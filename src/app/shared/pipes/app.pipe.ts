import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeleadingzeros'
})
export class RemoveLeadingZerosPipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value?.replace(/^[0]+/g, '');
  }

}

@Pipe({
  name: 'camelcase'
})
export class CamelCasePipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' ');
  }

}

@Pipe({
  name: 'camelCaseWithSpaces'
})
export class CamelCase implements PipeTransform {

  transform(value: string, arg1?: string, arg2?: string): string {
    return value.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (' ' + word.toUpperCase()));
  }

}

@Pipe({
  name: 'camelcaseWithReplace'
})
export class CamelCaseWithReplacePipe implements PipeTransform {

  transform(value: string, arg1?: string, arg2?: string): string {
    value = value?.toLowerCase().replace(/\s+/g, '')?.replace(/-/g, ' ');
    if (arg1) {
      value = value.replace(new RegExp(arg1, 'g'), ' ');
    }
    if (arg2) {
      value = value.replace(new RegExp(arg2, 'g'), ' ');
    }
    return value.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()));
  }

}
