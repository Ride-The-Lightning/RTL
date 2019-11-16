import { Component, OnInit, Input } from '@angular/core';
import { LoggerService } from '../../../shared/services/logger.service';

import { LookupNodeCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-node-lookup',
  templateUrl: './node-lookup.component.html',
  styleUrls: ['./node-lookup.component.css']
})
export class CLNodeLookupComponent implements OnInit {
  @Input() lookupResult: LookupNodeCL;
  public displayedColumns = ['type', 'address', 'port'];

  constructor(private logger: LoggerService) { }

  ngOnInit() {}

}
