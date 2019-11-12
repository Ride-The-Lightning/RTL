import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class CommonService implements OnDestroy {
  containerWidthChanged = new Subject<string>();

  sortDescByKey(array, key) {
    return array.sort(function (a, b) {
      const x = a[key];
      const y = b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
  }

  camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => { 
        return index == 0 ? word.toLowerCase() : word.toUpperCase(); 
    }).replace(/\s+/g, '');
  } 

  changeContainerWidth(fieldType: string) {
    this.containerWidthChanged.next(fieldType);
  }

  ngOnDestroy() {
    this.containerWidthChanged.next();
    this.containerWidthChanged.complete();
  }
}
