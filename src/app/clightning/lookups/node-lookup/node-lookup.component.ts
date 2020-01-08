import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatTableDataSource, MatSort } from '@angular/material';

import { LookupNodeCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class CLNodeLookupComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() lookupResult: LookupNodeCL;
  public addresses: any;
  public displayedColumns = ['type', 'address', 'port'];

  constructor() { }

  ngOnInit() {
    this.addresses = this.lookupResult.addresses ? new MatTableDataSource<any>([...this.lookupResult.addresses]) : new MatTableDataSource([]);
    this.addresses.data = this.lookupResult.addresses ? this.lookupResult.addresses : [];
    this.addresses.sort = this.sort;
  }

}
