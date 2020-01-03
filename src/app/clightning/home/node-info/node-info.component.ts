import { Component, OnChanges, Input } from '@angular/core';
import { GetInfoCL } from '../../../shared/models/clModels';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'rtl-cl-node-info',
  templateUrl: './node-info.component.html',
  styleUrls: ['./node-info.component.scss']
})
export class CLNodeInfoComponent implements OnChanges {
  @Input() information: GetInfoCL;
  @Input() showColorFieldSeparately: false;
  public chains: Array<string> = [''];

  constructor(private commonService: CommonService) { }

  ngOnChanges() {
    if(this.information && this.information.network) {
      this.chains = [''];
      this.chains.push(this.commonService.titleCase(this.information.network));
    }
  }

}
