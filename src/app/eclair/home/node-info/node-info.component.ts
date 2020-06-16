import { Component, OnChanges, Input } from '@angular/core';
import { GetInfo } from '../../../shared/models/eclrModels';

@Component({
  selector: 'rtl-eclr-node-info',
  templateUrl: './node-info.component.html',
  styleUrls: ['./node-info.component.scss']
})
export class ECLRNodeInfoComponent implements OnChanges {
  @Input() information: GetInfo;
  @Input() showColorFieldSeparately: false;
  public chains: Array<string> = [''];

  constructor() { }

  ngOnChanges() {
    this.chains = [];
    this.chains.push('Bitcoin ' + (this.information.network ? this.information.network : 'Testnet'));
  }

}
