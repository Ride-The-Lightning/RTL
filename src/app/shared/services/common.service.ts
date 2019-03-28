import { Injectable } from '@angular/core';

@Injectable()
export class CommonService {

  sortDescByKey(array, key) {
    return array.sort(function (a, b) {
      const x = a[key];
      const y = b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
  }

}
