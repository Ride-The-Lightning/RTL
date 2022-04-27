import { Component, OnInit, Input } from '@angular/core';

import { CommonService } from '../../../../shared/services/common.service';
import { Invoice } from '../../../../shared/models/lndModels';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-invoice-lookup',
  templateUrl: './invoice-lookup.component.html',
  styleUrls: ['./invoice-lookup.component.scss']
})
export class InvoiceLookupComponent implements OnInit {

  @Input() invoice: Invoice;
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 220;
    }
  }

  getDecimalFormat(htlc: any): string {
    return htlc.amt_msat < 1000 ? '1.0-4' : '1.0-0';
  }

}
