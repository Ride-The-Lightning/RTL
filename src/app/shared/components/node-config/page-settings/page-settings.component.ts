import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faPenRuler } from '@fortawesome/free-solid-svg-icons';

import { PAGE_SIZE_OPTIONS, ScreenSizeEnum, UI_MESSAGES, SORT_ORDERS } from '../../../services/consts-enums-functions';
import { ConfigSettingsNode } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { RTLState } from '../../../../store/rtl.state';
import { saveSettings } from '../../../../store/rtl.actions';
import { setChildNodeSettingsECL } from '../../../../eclair/store/ecl.actions';
import { setChildNodeSettingsCL } from '../../../../cln/store/cln.actions';
import { setChildNodeSettingsLND } from '../../../../lnd/store/lnd.actions';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { RTL_PAGE_SETTINGS } from '../../../models/pageSettings';

@Component({
  selector: 'rtl-page-settings',
  templateUrl: './page-settings.component.html',
  styleUrls: ['./page-settings.component.scss']
})
export class PageSettingsComponent implements OnInit, OnDestroy {

  public faPenRuler = faPenRuler;
  public selNode: ConfigSettingsNode | any;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public pageSettings = null;
  public sortOrders = SORT_ORDERS;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.selNode = selNode;
      this.pageSettings = RTL_PAGE_SETTINGS[this.selNode.lnImplementation.toUpperCase()].sort((x, y) => ((x.seq < y.seq) ? -1 : ((x.seq > y.seq) ? 1 : 0)));
      this.logger.info(selNode);
      this.logger.warn(this.pageSettings);
    });
  }

  onUpdatePageSettings() {
    // if (this.selNode.settings.fiatConversion && !this.selNode.settings.currencyUnit) {
    //   return true;
    // }
    // this.store.dispatch(setChildNodeSettingsECL({
    //   payload: {
    //     userPersona: this.selNode.settings.userPersona, channelBackupPath: this.selNode.settings.channelBackupPath, selCurrencyUnit: this.selNode.settings.currencyUnit, currencyUnits: this.selNode.settings.currencyUnits, fiatConversion: this.selNode.settings.fiatConversion, lnImplementation: this.selNode.lnImplementation, swapServerUrl: this.selNode.settings.swapServerUrl, boltzServerUrl: this.selNode.settings.boltzServerUrl
    //   }
    // }));
  }

  onResetPageSettings() {
    // this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, prevLnNodeIndex: +prevIndex, currentLnNode: this.selNode, isInitialSetup: true } }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
