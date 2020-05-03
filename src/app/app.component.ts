import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { UserIdleService } from 'angular-user-idle';
import * as sha256 from 'sha256';

import { LoggerService } from './shared/services/logger.service';
import { CommonService } from './shared/services/common.service';
import { SessionService } from './shared/services/session.service';
import { AlertTypeEnum, ScreenSizeEnum } from './shared/services/consts-enums-functions';
import { RTLConfiguration, Settings, ConfigSettingsNode, GetInfoRoot } from './shared/models/RTLconfig';

import * as RTLActions from './store/rtl.actions';
import * as fromRTLReducer from './store/rtl.reducers';

@Component({
  selector: 'rtl-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sideNavigation', { static: false }) sideNavigation: any;
  @ViewChild('sideNavContent', { static: false }) sideNavContent: any;
  public selNode: ConfigSettingsNode;
  public settings: Settings;
  public information: GetInfoRoot = {};
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: Info
  public flgSideNavOpened = true;
  public flgCopied = false;
  public appConfig: RTLConfiguration;
  public accessKey = '';
  public xSmallScreen = false;
  public smallScreen = false;
  public flgSidenavPinned = true;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions,
    private userIdle: UserIdleService, private router: Router, private sessionService: SessionService, private breakpointObserver: BreakpointObserver, private renderer: Renderer2) {}

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) { return; }
      document.getElementsByTagName('mat-sidenav-content')[0].scrollTo(0, 0);
    });    
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.TabletPortrait, Breakpoints.Small, Breakpoints.Medium])
    .pipe(takeUntil(this.unSubs[5]))
    .subscribe((matches) => {
      if(matches.breakpoints[Breakpoints.XSmall]) {
        this.commonService.setScreenSize(ScreenSizeEnum.XS);
        this.xSmallScreen = true;
        this.smallScreen = true;
      } else if(matches.breakpoints[Breakpoints.TabletPortrait]) {
        this.commonService.setScreenSize(ScreenSizeEnum.SM);
        this.xSmallScreen = false;
        this.smallScreen = true;
      } else if(matches.breakpoints[Breakpoints.Small] || matches.breakpoints[Breakpoints.Medium]) {
        this.commonService.setScreenSize(ScreenSizeEnum.MD);
        this.xSmallScreen = false;
        this.smallScreen = false;
      } else {
        this.commonService.setScreenSize(ScreenSizeEnum.LG);
        this.xSmallScreen = false;
        this.smallScreen = false;
      }
    });
    
    this.store.dispatch(new RTLActions.FetchRTLConfig());
    this.accessKey = this.readAccessKey();
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(rtlStore => {
      this.selNode = rtlStore.selNode;
      this.settings = this.selNode.settings;
      this.appConfig = rtlStore.appConfig;
      this.information = rtlStore.nodeData;
      this.flgLoading[0] = ( this.information.identity_pubkey) ? false : true;
      this.logger.info(this.settings);
      if (!this.sessionService.getItem('token')) {
        this.flgLoading[0] = false;
      }
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.SET_RTL_CONFIG))
    .subscribe((action: (RTLActions.SetRTLConfig)) => {
      if (action.type === RTLActions.SET_RTL_CONFIG) {
        if (!this.sessionService.getItem('token')) {
          if (+action.payload.sso.rtlSSO) {
            this.store.dispatch(new RTLActions.Login({password: sha256(this.accessKey), initialPass: false}));
          } else {
            this.router.navigate([this.appConfig.sso.logoutRedirectLink]);
          }
        }
      }     
    });
    this.userIdle.startWatching();
    this.userIdle.onTimerStart().pipe(takeUntil(this.unSubs[2])).subscribe(count => {});
    this.userIdle.onTimeout().pipe(takeUntil(this.unSubs[3])).subscribe(() => {
      if (this.sessionService.getItem('token')) {
        this.logger.warn('Time limit exceeded for session inactivity.');
        this.store.dispatch(new RTLActions.CloseAllDialogs());
        this.store.dispatch(new RTLActions.OpenAlert({ data: {
          type: AlertTypeEnum.WARNING,
          alertTitle: 'Logging out',
          titleMessage: 'Time limit exceeded for session inactivity.'
        }}));
        this.store.dispatch(new RTLActions.Logout());
        this.userIdle.resetTimer();
      }
    });
  }

  private readAccessKey() {
    const url = window.location.href;
    return url.includes('access-key=') ? url.substring(url.lastIndexOf('access-key=') + 11).trim() : '';
  }

  ngAfterViewInit() {
    if (this.smallScreen) {
      this.sideNavigation.close();
    } else {
      setTimeout(() => {
        this.renderer.setStyle(this.sideNavContent.elementRef.nativeElement, 'marginLeft', '22rem'); //$regular-sidenav-width
      }, 100);
    }
  }

  sideNavToggle() {
    this.flgSideNavOpened = !this.flgSideNavOpened;
    this.sideNavigation.toggle();
  }

  onNavigationClicked(event: any) {
    if (this.smallScreen) {
      this.sideNavigation.close();
    }
  }

  copiedText(payload) {
    this.flgCopied = true;
    setTimeout(() => {this.flgCopied = false; }, 5000);
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}
