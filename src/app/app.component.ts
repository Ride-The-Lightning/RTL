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
import { routeAnimation } from './shared/animation/route-animation';

import * as RTLActions from './store/rtl.actions';
import * as fromRTLReducer from './store/rtl.reducers';

@Component({
  selector: 'rtl-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimation]
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
  public flgLoggedIn = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions,
    private userIdle: UserIdleService, private router: Router, private sessionService: SessionService, private breakpointObserver: BreakpointObserver, private renderer: Renderer2) {}

  ngOnInit() {
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) { return; }
      document.getElementsByTagName('mat-sidenav-content')[0].scrollTo(0, 0);
    });
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.TabletPortrait, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((matches) => {
      if(matches.breakpoints[Breakpoints.XSmall]) {
        this.commonService.setScreenSize(ScreenSizeEnum.XS);
        this.smallScreen = true;
      } else if(matches.breakpoints[Breakpoints.TabletPortrait]) {
        this.commonService.setScreenSize(ScreenSizeEnum.SM);
        this.smallScreen = true;
      } else if(matches.breakpoints[Breakpoints.Small] || matches.breakpoints[Breakpoints.Medium]) {
        this.commonService.setScreenSize(ScreenSizeEnum.MD);
        this.smallScreen = false;
      } else if(matches.breakpoints[Breakpoints.Large]) {
        this.commonService.setScreenSize(ScreenSizeEnum.LG);
        this.smallScreen = false;
      } else {
        this.commonService.setScreenSize(ScreenSizeEnum.XL);
        this.smallScreen = false;
      }
    });
    this.store.dispatch(new RTLActions.FetchRTLConfig());
    this.accessKey = this.readAccessKey();
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(rtlStore => {
      this.selNode = rtlStore.selNode;
      this.settings = this.selNode.settings;
      this.appConfig = rtlStore.appConfig;
      this.information = rtlStore.nodeData;
      this.flgLoading[0] = ( this.information.identity_pubkey) ? false : true;
      this.logger.info(this.settings);
      if (!this.sessionService.getItem('token')) {
        this.flgLoggedIn = false;
        this.flgLoading[0] = false;
      } else {
        this.flgLoggedIn = true;
        this.userIdle.startWatching();
      }
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === RTLActions.SET_RTL_CONFIG || action.type === RTLActions.LOGOUT))
    .subscribe((action: (RTLActions.SetRTLConfig | RTLActions.Logout)) => {
      if (action.type === RTLActions.SET_RTL_CONFIG) {
        if (!this.sessionService.getItem('token')) {
          if (+action.payload.sso.rtlSSO) {
            if(!this.accessKey || this.accessKey.trim().length < 32) {
              this.router.navigate(['./error'], { state: {errorCode: '406', errorMessage: 'Access key too short. It should be at least 32 characters long.'} });
            } else {
              this.store.dispatch(new RTLActions.Login({password: sha256(this.accessKey), defaultPassword: false}));
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
    this.userIdle.onTimerStart().pipe(takeUntil(this.unSubs[3])).subscribe(count => {this.logger.info('Counting Down: ' + (11 - count))});
    this.userIdle.onTimeout().pipe(takeUntil(this.unSubs[4])).subscribe(() => {
      this.logger.info('Time Out!');
      if (this.sessionService.getItem('token')) {
        this.flgLoggedIn = false;
        this.logger.warn('Time limit exceeded for session inactivity.');
        this.store.dispatch(new RTLActions.CloseAllDialogs());
        this.store.dispatch(new RTLActions.OpenAlert({ data: {
          type: AlertTypeEnum.WARNING,
          alertTitle: 'Logging out',
          titleMessage: 'Time limit exceeded for session inactivity.'
        }}));
        this.store.dispatch(new RTLActions.Logout());
      }
    });
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
        if (this.flgLoggedIn) {
          this.renderer.setStyle(this.sideNavContent.elementRef.nativeElement, 'marginLeft', '22rem'); //$regular-sidenav-width          
        }
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
