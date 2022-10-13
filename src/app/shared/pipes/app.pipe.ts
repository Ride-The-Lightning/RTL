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
  name: 'camelcaseWithReplace'
})
export class CamelCaseWithReplacePipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value?.replace(/\s+/g, '')?.replace(/-/g, ' ').replace(new RegExp(args, 'g'), ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()));
  }

}
