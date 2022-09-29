import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faCog } from '@fortawesome/free-solid-svg-icons';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { fetchConfig } from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-bitcoin-config',
  templateUrl: './bitcoin-config.component.html',
  styleUrls: ['./bitcoin-config.component.scss']
})
export class BitcoinConfigComponent implements OnInit, OnDestroy {

  public configData = '';
  public fileFormat = 'INI';
  public faCog = faCog;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private rtlEffects: RTLEffects, private router: Router) { }

  ngOnInit() {
    this.store.dispatch(fetchConfig({ payload: 'bitcoind' }));
    this.rtlEffects.showLnConfig.
      pipe(takeUntil(this.unSubs[1])).
      subscribe((config: any) => {
        const configFile = config.data;
        this.fileFormat = config.format;
        if (configFile !== '' && configFile && (this.fileFormat === 'INI' || this.fileFormat === 'HOCON')) {
          this.configData = configFile.split('\n');
        } else if (configFile !== '' && configFile && this.fileFormat === 'JSON') {
          this.configData = configFile;
        } else {
          this.configData = '';
        }
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
