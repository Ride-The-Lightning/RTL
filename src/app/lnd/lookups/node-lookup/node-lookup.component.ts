import { Component, OnInit, Input } from '@angular/core';

import { GraphNode } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.css']
})
export class NodeLookupComponent implements OnInit {
  @Input() lookupResult: GraphNode;
  public displayedColumns = ['network', 'addr'];

  constructor() { }

  ngOnInit() {}

}
