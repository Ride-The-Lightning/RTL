import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { GraphNode } from '../../../../shared/models/lndModels';
import { NodeFeaturesLND } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';

@Component({
  selector: 'rtl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.scss']
})
export class NodeLookupComponent {

  @Input() lookupResult: GraphNode;
  public nodeFeaturesEnum = NodeFeaturesLND;
  public displayedColumns = ['network', 'addr', 'actions'];

  constructor(private logger: LoggerService, private snackBar: MatSnackBar) { }

  onCopyNodeURI(payload: string) {
    this.snackBar.open('Node URI copied.');
    this.logger.info('Copied Text: ' + payload);
  }

}
