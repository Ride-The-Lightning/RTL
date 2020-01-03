import { Component, OnChanges, Input } from '@angular/core';
import { ChannelsStatusCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-channel-status-info',
  templateUrl: './channel-status-info.component.html',
  styleUrls: ['./channel-status-info.component.scss']
})
export class CLChannelStatusInfoComponent implements OnChanges {
  @Input() channelsStatus: ChannelsStatusCL = {};

  constructor() {}

  ngOnChanges() {}

}
