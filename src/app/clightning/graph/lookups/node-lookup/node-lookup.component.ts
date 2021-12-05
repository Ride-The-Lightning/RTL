import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { LookupNode } from '../../../../shared/models/clModels';
import { NODE_FEATURES_CLT } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';

@Component({
  selector: 'rtl-cl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class CLNodeLookupComponent implements OnInit {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @Input() lookupResult: LookupNode;
  public featureDescriptions: string[] = [];
  public addresses: any;
  public displayedColumns = ['type', 'address', 'port', 'actions'];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.addresses = this.lookupResult && this.lookupResult.addresses ? new MatTableDataSource<any>([...this.lookupResult.addresses]) : new MatTableDataSource([]);
    this.addresses.data = this.lookupResult.addresses || [];
    this.addresses.sort = this.sort;
    this.addresses.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    if (this.lookupResult.features && this.lookupResult.features.trim() !== '') {
      NODE_FEATURES_CLT.forEach((feature) => {
        if (!!(parseInt(this.lookupResult.features, 16) & ((1 << feature.range.min) | (1 << feature.range.max)))) {
          this.featureDescriptions.push(feature.description + '\n');
        }
      });
    }
  }

  onCopyNodeURI(payload: string) {
    this.snackBar.open('Node URI copied.');
    this.logger.info('Copied Text: ' + payload);
  }

}
