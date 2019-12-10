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
  allChannelBalances = [];

  constructor() {}

  ngOnChanges() {
    // this.allChannelBalances = [];
    // this.allChannels.forEach((channel, idx) => {
    //   if(idx < 20) {
    //     this.allChannelBalances.push({"name": ((idx + 1) + ' ' + channel.remote_alias), "series": [{ "name": "Local Balance", "value": -channel.local_balance}, {"name": "Remote Balance","value": +channel.remote_balance}]});
    //   }
    // });
  }

}
