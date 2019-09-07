import { Component, OnInit, Input } from '@angular/core';
import { formatDate } from '@angular/common';

import { GraphNodeCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.css']
})
export class CLNodeLookupComponent implements OnInit {
  @Input() lookupResult: GraphNodeCL;
  public displayedColumns = ['network', 'addr'];

  constructor() { }

  ngOnInit() {
    if (undefined !== this.lookupResult && undefined !== this.lookupResult.node && undefined !== this.lookupResult.node.last_update_str) {
      this.lookupResult.node.last_update_str = (this.lookupResult.node.last_update_str === '') ?
        '' : formatDate(this.lookupResult.node.last_update_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
    }
  }

}
