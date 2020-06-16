import { Component, OnChanges, Input } from '@angular/core';
import { ChannelsStatus } from '../../../shared/models/eclrModels';

@Component({
  selector: 'rtl-eclr-channel-status-info',
  templateUrl: './channel-status-info.component.html',
  styleUrls: ['./channel-status-info.component.scss']
})
export class ECLRChannelStatusInfoComponent implements OnChanges {
  @Input() channelsStatus: ChannelsStatus = {};

  constructor() {}

  ngOnChanges() {}

}
