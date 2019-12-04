import { Component, OnChanges, Input } from '@angular/core';
import { Channel } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-channel-capacity-info',
  templateUrl: './channel-capacity-info.component.html',
  styleUrls: ['./channel-capacity-info.component.scss']
})
export class ChannelCapacityInfoComponent implements OnChanges {
  @Input() channelBalances: {localBalance: number, remoteBalance: number};
  @Input() allChannels: Channel[];

  constructor() {}

  ngOnChanges() {}

}
