import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { faBalanceScale, faDumbbell } from '@fortawesome/free-solid-svg-icons';

import { Channel } from '../../../shared/models/eclModels';

@Component({
  selector: 'rtl-ecl-channel-capacity-info',
  templateUrl: './channel-capacity-info.component.html',
  styleUrls: ['./channel-capacity-info.component.scss']
})
export class ECLChannelCapacityInfoComponent {
  public faBalanceScale = faBalanceScale;
  public faDumbbell = faDumbbell;
  @Input() channelBalances: {localBalance: number, remoteBalance: number, balancedness: number};
  @Input() allChannels: Channel[];
  @Input() sortBy: string = 'Balance Score';

  constructor(private router: Router) {}

  goToChannels() {
    this.router.navigateByUrl('/ecl/connections');
  }

}
