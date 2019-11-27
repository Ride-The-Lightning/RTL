import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { UserIdleService } from 'angular-user-idle';
import * as sha256 from 'sha256';

import { LoggerService } from './shared/services/logger.service';
import { CommonService } from './shared/services/common.service';
import { SessionService } from './shared/services/session.service';
import { RTLConfiguration, Settings, LightningNode, GetInfoRoot } from './shared/models/RTLconfig';

import * as RTLActions from './store/rtl.actions';
import * as fromRTLReducer from './store/rtl.reducers';
import { AlertTypeEnum } from './shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sideNavigation', { static: false }) sideNavigation: any;
  public selNode: LightningNode;
  public settings: Settings;
  public information: GetInfoRoot = {};
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: Info
  public flgCopied = false;
  public appConfig: RTLConfiguration;
  public accessKey = '';
  public smallScreen = false;
  unsubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions,
    private userIdle: UserIdleService, private router: Router, private sessionService: SessionService) {}

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchRTLConfig());
    this.accessKey = this.readAccessKey();
    this.store.select('root')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe(rtlStore => {
      this.selNode = rtlStore.selNode;
      this.settings = this.selNode.settings;
      this.appConfig = rtlStore.appConfig;
      this.information = rtlStore.nodeData;
      this.flgLoading[0] = (undefined !== this.information.identity_pubkey) ? false : true;
      if (window.innerWidth <= 768) {
        this.settings.menu = 'vertical';
        this.settings.flgSidenavOpened = false;
        this.settings.flgSidenavPinned = false;
      }
      if (window.innerWidth <= 414) {
        this.smallScreen = true;
      }
      this.logger.info(this.settings);
      if (!this.sessionService.getItem('token')) {
        this.flgLoading[0] = false;
      }
    });
    this.actions$.pipe(takeUntil(this.unsubs[1]),
    filter((action) => action.type === RTLActions.SET_RTL_CONFIG))
    .subscribe((action: (RTLActions.SetRTLConfig)) => {
      if (action.type === RTLActions.SET_RTL_CONFIG) {
        if (!this.sessionService.getItem('token')) {
          if (+action.payload.sso.rtlSSO) {
            this.store.dispatch(new RTLActions.Signin(sha256(this.accessKey)));
          } else {
            this.router.navigate([this.appConfig.sso.logoutRedirectLink]);
          }
        }
        if (this.settings.menuType === 'compact' || this.settings.menuType === 'mini') {
          this.sideNavigation.toggle(); // To dynamically update the width to 100% after side nav is closed
          setTimeout(() => { this.sideNavigation.toggle(); }, 100);
        }
      }     
    });
    this.userIdle.startWatching();
    this.userIdle.onTimerStart().pipe(takeUntil(this.unsubs[2])).subscribe(count => {});
    this.userIdle.onTimeout().pipe(takeUntil(this.unsubs[3])).subscribe(() => {
      if (this.sessionService.getItem('token')) {
        this.logger.warn('Time limit exceeded for session inactivity.');
        this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
          type: AlertTypeEnum.WARNING,
          alertTitle: 'Logging out',
          titleMessage: 'Time limit exceeded for session inactivity.'
        }}));
        this.store.dispatch(new RTLActions.Signout());
        this.userIdle.resetTimer();
      }
    });
    this.commonService.containerWidthChanged.pipe(takeUntil(this.unsubs[4]))
    .subscribe((fieldType: string) => {
      if(fieldType !== 'menuType') {
        this.sideNavToggle();
      } else {
        this.sideNavigation.toggle(); // To dynamically update the width to 100% after side nav is closed
        setTimeout(() => { this.sideNavigation.toggle(); }, 0);
      }
    });
  }

  private readAccessKey() {
    const url = window.location.href;
    return url.includes('access-key=') ? url.substring(url.lastIndexOf('access-key=') + 11).trim() : '';
  }

  ngAfterViewInit() {
    if (this.settings.menuType.toLowerCase() !== 'regular' || !this.settings.flgSidenavPinned) {
      this.sideNavigation.close();
    }
    if (window.innerWidth <= 768) {
      this.sideNavigation.close();
    }
  }

  @HostListener('window:resize')
  public onWindowResize(): void {
    if (window.innerWidth <= 768) {
      this.settings.menu = 'vertical';
      this.settings.flgSidenavOpened = false;
      this.settings.flgSidenavPinned = false;
    }
  }

  sideNavToggle() {
    this.settings.flgSidenavOpened = !this.settings.flgSidenavOpened;
    this.sideNavigation.toggle();
  }

  onNavigationClicked(event: any) {
    if (window.innerWidth <= 414) {
      this.sideNavigation.close();
    }
  }

  copiedText(payload) {
    this.flgCopied = true;
    setTimeout(() => {this.flgCopied = false; }, 5000);
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}
