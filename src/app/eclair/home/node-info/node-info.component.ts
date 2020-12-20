import { Component, OnChanges, Input } from '@angular/core';
import { GetInfo } from '../../../shared/models/eclModels';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'rtl-ecl-node-info',
  templateUrl: './node-info.component.html',
  styleUrls: ['./node-info.component.scss']
})
export class ECLNodeInfoComponent implements OnChanges {
  @Input() information: GetInfo;
  @Input() showColorFieldSeparately: boolean;
  public chains: Array<string> = [''];

  constructor(private commonService: CommonService) { }

  ngOnChanges() {
    this.chains = [];
    this.chains.push('Bitcoin ' + (this.information.network ? this.commonService.titleCase(this.information.network) : 'Testnet'));
  }

}
