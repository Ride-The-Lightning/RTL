import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { faBalanceScale, faDumbbell } from '@fortawesome/free-solid-svg-icons';

import { Channel } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cln-channel-capacity-info',
  templateUrl: './channel-capacity-info.component.html',
  styleUrls: ['./channel-capacity-info.component.scss']
})
export class CLNChannelCapacityInfoComponent {

  public faBalanceScale = faBalanceScale;
  public faDumbbell = faDumbbell;
  @Input() channelBalances: { localBalance: number, remoteBalance: number, balancedness: number };
  @Input() activeChannels: Channel[];
  @Input() sortBy = 'Balance Score';
  @Input() errorMessage: string;

  constructor(private router: Router) { }

  goToChannels() {
    this.router.navigateByUrl('/cln/connections');
  }

}
