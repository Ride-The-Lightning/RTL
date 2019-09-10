import { Component, OnInit, Input } from '@angular/core';
import { formatDate } from '@angular/common';

import { LookupNodeCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.css']
})
export class CLNodeLookupComponent implements OnInit {
  @Input() lookupResult: LookupNodeCL;
  public displayedColumns = ['type', 'address', 'port'];

  constructor() { }

  ngOnInit() {
    console.warn(this.lookupResult);
    if (undefined !== this.lookupResult && undefined !== this.lookupResult.last_timestamp_str) {
      this.lookupResult.last_timestamp_str = (this.lookupResult.last_timestamp_str === '') ?
        '' : formatDate(this.lookupResult.last_timestamp_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
    }
  }

}
