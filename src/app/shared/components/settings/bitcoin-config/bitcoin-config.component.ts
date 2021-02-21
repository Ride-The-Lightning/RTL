import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faCog } from '@fortawesome/free-solid-svg-icons';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-bitcoin-config',
  templateUrl: './bitcoin-config.component.html',
  styleUrls: ['./bitcoin-config.component.scss']
})
export class BitcoinConfigComponent implements OnInit, OnDestroy {
  public selectedNodeType = '';
  public configData = '';
  public fileFormat = 'INI';
  public faCog = faCog;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private router: Router) {}

  ngOnInit() {
    this.selectedNodeType = (this.router.url.includes('bconfig')) ? 'bitcoind' : 'ln';
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.selectedNodeType = (value.urlAfterRedirects.includes('bconfig')) ? 'bitcoind' : 'ln';
    });
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Config File...'));
    this.store.dispatch(new RTLActions.FetchConfig(this.selectedNodeType));
    this.rtlEffects.showLnConfig
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((config: any) => {
      const configFile = config.data;
      this.fileFormat = config.format;
      if (configFile !== '' &&  configFile && (this.fileFormat === 'INI' || this.fileFormat === 'HOCON')) {
        this.configData = configFile.split('\n');
      } else if (configFile !== '' &&  configFile && this.fileFormat === 'JSON') {
        this.configData = configFile;
      } else {
        this.configData = '';
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
