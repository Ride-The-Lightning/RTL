import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { LookupNode } from '../../../shared/models/eclModels';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'rtl-ecl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class ECLNodeLookupComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() lookupResult: LookupNode;
  public addresses: any;
  public displayedColumns = ['address', 'actions'];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.addresses = this.lookupResult.addresses ? new MatTableDataSource<any>([...this.lookupResult.addresses]) : new MatTableDataSource([]);
    this.addresses.data = this.lookupResult.addresses ? this.lookupResult.addresses : [];
    this.addresses.sort = this.sort;
  }

  onCopyNodeURI(payload: string) {
    this.snackBar.open('Node URI copied.');
    this.logger.info('Copied Text: ' + payload);
  }

}
