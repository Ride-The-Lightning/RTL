import { Component, OnChanges, Input } from '@angular/core';
import { faBalanceScale, faDumbbell } from '@fortawesome/free-solid-svg-icons';

import { Channel } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-channel-capacity-info',
  templateUrl: './channel-capacity-info.component.html',
  styleUrls: ['./channel-capacity-info.component.scss']
})
export class ChannelCapacityInfoComponent implements OnChanges {
  public faBalanceScale = faBalanceScale;
  public faDumbbell = faDumbbell;
  @Input() channelBalances: {localBalance: number, remoteBalance: number};
  @Input() allChannels: Channel[];
  @Input() sortBy: string = 'Channel Balance';

  constructor() {}

  ngOnChanges() {}

}
