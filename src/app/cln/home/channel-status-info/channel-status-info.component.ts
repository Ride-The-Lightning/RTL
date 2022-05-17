import { Component, Input } from '@angular/core';
import { ChannelsStatus } from '../../../shared/models/clnModels';

@Component({
  selector: 'rtl-cln-channel-status-info',
  templateUrl: './channel-status-info.component.html',
  styleUrls: ['./channel-status-info.component.scss']
})
export class CLNChannelStatusInfoComponent {

  @Input() channelsStatus: ChannelsStatus = { active: {}, pending: {}, inactive: {} };
  @Input() errorMessage: string;

  constructor() { }

}
