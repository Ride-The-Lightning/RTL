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
  name: 'swapState'
})
export class SwapStatePipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value?.replace('State_', '').replace('SwapInSender_', '').replace('SwapOutSender_', '').replace('SwapInReceiver_', '').replace('SwapOutReceiver_', '').replace('_', ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => ' ' + word);
  }

}
