import { Component, Input } from '@angular/core';
import { ChannelsStatus } from '../../../shared/models/eclModels';

@Component({
  selector: 'rtl-ecl-channel-status-info',
  templateUrl: './channel-status-info.component.html',
  styleUrls: ['./channel-status-info.component.scss']
})
export class ECLChannelStatusInfoComponent {
  @Input() channelsStatus: ChannelsStatus = {};
  @Input() errorMessage: string;

  constructor() {}

}
