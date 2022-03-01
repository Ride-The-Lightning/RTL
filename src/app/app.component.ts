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
import { AlertTypeEnum, RTLActions, ScreenSizeEnum } from './shared/services/consts-enums-functions';
import { rootAppConfig, rootNodeData, rootSelectedNode } from './store/rtl.selector';
import { RTLConfiguration, Settings, GetInfoRoot } from './shared/models/RTLconfig';
import { closeAllDialogs, fetchRTLConfig, login, logout, openAlert } from './store/rtl.actions';
import { routeAnimation } from './shared/animation/route-animation';

import { RTLState } from './store/rtl.state';

@Component({
  selector: 'rtl-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimation]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('sideNavigation', { static: false }) sideNavigation: any;
  @ViewChild('sideNavContent', { static: false }) sideNavContent: any;
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
  public flgLoggedIn = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(
    private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private actions: Actions,
    private userIdle: UserIdleService, private router: Router, private sessionService: SessionService, private breakpointObserver: BreakpointObserver, private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      document.getElementsByTagName('mat-sidenav-content')[0].scrollTo(0, 0);
    });
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.TabletPortrait, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge]).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((matches) => {
        if (matches.breakpoints[Breakpoints.XSmall]) {
          this.commonService.setScreenSize(ScreenSizeEnum.XS);
          this.smallScreen = true;
        } else if (matches.breakpoints[Breakpoints.TabletPortrait]) {
          this.commonService.setScreenSize(ScreenSizeEnum.SM);
          this.smallScreen = true;
        } else if (matches.breakpoints[Breakpoints.Small] || matches.breakpoints[Breakpoints.Medium]) {
          this.commonService.setScreenSize(ScreenSizeEnum.MD);
          this.smallScreen = false;
        } else if (matches.breakpoints[Breakpoints.Large]) {
          this.commonService.setScreenSize(ScreenSizeEnum.LG);
          this.smallScreen = false;
        } else {
          this.commonService.setScreenSize(ScreenSizeEnum.XL);
          this.smallScreen = false;
        }
      });
    this.store.dispatch(fetchRTLConfig());
    this.accessKey = this.readAccessKey();
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((selNode) => {
      this.settings = selNode.settings;
      if (!this.sessionService.getItem('token')) {
        this.flgLoggedIn = false;
        this.flgLoading[0] = false;
      } else {
        this.flgLoggedIn = true;
        this.userIdle.startWatching();
      }
    });
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[2])).subscribe((appConfig) => { this.appConfig = appConfig; });
    this.store.select(rootNodeData).pipe(takeUntil(this.unSubs[3])).subscribe((nodeData) => {
      this.information = nodeData;
      this.flgLoading[0] = !(this.information.identity_pubkey);
      this.logger.info(this.information);
    });
    if (this.sessionService.getItem('defaultPassword') === 'true') {
      this.flgSideNavOpened = false;
    }
    this.actions.pipe(
      takeUntil(this.unSubs[4]),
      filter((action) => action.type === RTLActions.SET_RTL_CONFIG || action.type === RTLActions.LOGOUT)).
      subscribe((action: (any)) => {
        if (action.type === RTLActions.SET_RTL_CONFIG) {
          if (!this.sessionService.getItem('token')) {
            if (+action.payload.sso.rtlSSO) {
              if (!this.accessKey || this.accessKey.trim().length < 32) {
                this.router.navigate(['./error'], { state: { errorCode: '406', errorMessage: 'Access key too short. It should be at least 32 characters long.' } });
              } else {
                this.store.dispatch(login({ payload: { password: sha256(this.accessKey).toString(), defaultPassword: false } }));
              }
            } else {
              this.router.navigate(['./login']);
            }
          }
        }
        if (action.type === RTLActions.LOGOUT) {
          this.flgLoggedIn = false;
          this.userIdle.stopWatching();
          this.userIdle.stopTimer();
        }
      });
    this.userIdle.onTimerStart().pipe(takeUntil(this.unSubs[5])).subscribe((count) => {
      this.logger.info('Counting Down: ' + (11 - count));
    });
    this.userIdle.onTimeout().pipe(takeUntil(this.unSubs[6])).subscribe(() => {
      this.logger.info('Time Out!');
      if (this.sessionService.getItem('token')) {
        this.flgLoggedIn = false;
        this.logger.warn('Time limit exceeded for session inactivity.');
        this.store.dispatch(closeAllDialogs());
        this.store.dispatch(openAlert({
          payload: {
            data: {
              type: AlertTypeEnum.WARNING,
              alertTitle: 'Logging out',
              titleMessage: 'Time limit exceeded for session inactivity.'
            }
          }
        }));
        this.store.dispatch(logout());
      }
    });
    if (this.sessionService.getItem('defaultPassword') === 'true') {
      this.flgSideNavOpened = false;
    }
  }

  private readAccessKey() {
    const url = window.location.href;
    return url.includes('access-key=') ? url.substring(url.lastIndexOf('access-key=') + 11).trim() : null;
  }

  ngAfterViewInit() {
    if (this.smallScreen) {
      this.sideNavigation.close();
      this.commonService.setContainerSize(this.sideNavContent.elementRef.nativeElement.clientWidth, this.sideNavContent.elementRef.nativeElement.clientHeight);
    } else {
      setTimeout(() => {
        this.renderer.setStyle(this.sideNavContent.elementRef.nativeElement, 'marginLeft', '22rem'); // $regular-sidenav-width
        this.commonService.setContainerSize(this.sideNavContent.elementRef.nativeElement.clientWidth, this.sideNavContent.elementRef.nativeElement.clientHeight);
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

  copiedText(payload: string) {
    this.flgCopied = true;
    setTimeout(() => {
      this.flgCopied = false;
    }, 5000);
    this.logger.info('Copied Text: ' + payload);
  }

  ngOnDestroy() {
    this.unSubs.forEach((unsub) => {
      unsub.next();
      unsub.complete();
    });
  }

}
