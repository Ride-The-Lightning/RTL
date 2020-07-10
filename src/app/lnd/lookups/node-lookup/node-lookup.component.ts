import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { GraphNode } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'rtl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class NodeLookupComponent implements OnInit {
  @Input() lookupResult: GraphNode;
  public displayedColumns = ['network', 'addr', 'actions'];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {}

  onCopyNodeURI(payload: string) {
    this.snackBar.open('Node URI copied.');
    this.logger.info('Copied Text: ' + payload);    
  }
}
