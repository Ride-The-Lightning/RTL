import { Component, OnChanges, Input } from '@angular/core';
import { ChannelsStatus } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-channel-status-info',
  templateUrl: './channel-status-info.component.html',
  styleUrls: ['./channel-status-info.component.scss']
})
export class CLChannelStatusInfoComponent implements OnChanges {
  @Input() channelsStatus: ChannelsStatus = {};

  constructor() {}

  ngOnChanges() {}

}
