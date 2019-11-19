import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeleadingzeros'
})
export class RemoveLeadingZerosPipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value.replace(/^[0]+/g, '');
  }

}
