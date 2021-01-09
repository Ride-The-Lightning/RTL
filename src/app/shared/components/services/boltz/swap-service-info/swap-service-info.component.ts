import { Component, OnInit, Input } from '@angular/core';
import { ServiceInfo } from '../../../../models/boltzModels';

@Component({
  selector: 'rtl-boltz-service-info',
  templateUrl: './swap-service-info.component.html',
  styleUrls: ['./swap-service-info.component.scss']
})
export class SwapServiceInfoComponent implements OnInit {
  @Input() serviceInfo: ServiceInfo = {};
  @Input() termCaption = '';
  @Input() showPanel = true;
  @Input() panelExpanded = false;
  public flgShowPanel = false;

  constructor() {}

  ngOnInit() {
    setTimeout(() => { this.flgShowPanel = true; }, 1200);
  }

}
