import { Component, OnChanges, Input } from '@angular/core';
import { faBalanceScale, faDumbbell } from '@fortawesome/free-solid-svg-icons';

import { ChannelCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-channel-capacity-info',
  templateUrl: './channel-capacity-info.component.html',
  styleUrls: ['./channel-capacity-info.component.scss']
})
export class CLChannelCapacityInfoComponent implements OnChanges {
  public faBalanceScale = faBalanceScale;
  public faDumbbell = faDumbbell;
  @Input() channelBalances: {localBalance: number, remoteBalance: number, balancedness: string};
  @Input() allChannels: ChannelCL[];
  @Input() sortBy: string = 'Balance Score';

  constructor() {}

  ngOnChanges() {}

}
