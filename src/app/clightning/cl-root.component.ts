import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'rtl-cl-root',
  templateUrl: './cl-root.component.html',
  styleUrls: ['./cl-root.component.scss']
})
export class CLRootComponent implements OnInit {
  
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    console.warn('CL ROOT');
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
  }

  // @ViewChild('sideNavigation', { static: false }) sideNavigation: any;
  // @ViewChild('settingSidenav', { static: true }) settingSidenav: any;
  // public selNode: Node;
  // public settings: Settings;
  // public information: GetInfo = {};
  // public flgLoading: Array<Boolean | 'error'> = [true]; // 0: Info
  // public flgCopied = false;
  // public appConfig: RTLConfiguration;
  // public accessKey = '';
  // public smallScreen = false;
  // unsubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  // constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private actions$: Actions,
  //   private userIdle: UserIdleService, private router: Router) {}

  // ngOnInit() {
  //   this.store.dispatch(new RTLActions.FetchRTLConfig());
  //   this.accessKey = this.readAccessKey();
  //   this.store.select('rtlRoot')
  //   .pipe(takeUntil(this.unsubs[0]))
  //   .subscribe(rtlStore => {
  //     this.selNode = rtlStore.selNode;
  //     this.settings = this.selNode.settings;
  //     this.appConfig = rtlStore.appConfig;
  //     this.information = rtlStore.information;
  //     this.flgLoading[0] = (undefined !== this.information.identity_pubkey) ? false : true;
  //     if (window.innerWidth <= 768) {
  //       this.settings.menu = 'Vertical';
  //       this.settings.flgSidenavOpened = false;
  //       this.settings.flgSidenavPinned = false;
  //     }
  //     if (window.innerWidth <= 414) {
  //       this.smallScreen = true;
  //     }
  //     this.logger.info(this.settings);
  //     if (!sessionStorage.getItem('token')) {
  //       this.flgLoading[0] = false;
  //     }
  //   });
  //   if (sessionStorage.getItem('token')) {
  //     this.store.dispatch(new RTLActions.FetchInfo());
  //   }
  //   this.actions$
  //   .pipe(
  //     takeUntil(this.unsubs[1]),
  //     filter((action) => action.type === RTLActions.INIT_APP_DATA || action.type === RTLActions.SET_RTL_CONFIG)
  //   ).subscribe((actionPayload: (RTLActions.InitAppData | RTLActions.SetRTLConfig)) => {
  //     if (actionPayload.type === RTLActions.SET_RTL_CONFIG) {
  //       if (!sessionStorage.getItem('token')) {
  //         if (+actionPayload.payload.sso.rtlSSO) {
  //           this.store.dispatch(new RTLActions.Signin(sha256(this.accessKey)));
  //         } else {
  //           this.router.navigate([this.appConfig.sso.logoutRedirectLink]);
  //         }
  //       }
  //       if (
  //         this.settings.menu === 'Horizontal' ||
  //         this.settings.menuType === 'Compact' ||
  //         this.settings.menuType === 'Mini') {
  //         this.settingSidenav.toggle(); // To dynamically update the width to 100% after side nav is closed
  //         setTimeout(() => { this.settingSidenav.toggle(); }, 100);
  //       }
  //     } else if (actionPayload.type === RTLActions.INIT_APP_DATA) {
  //       this.store.dispatch(new RTLActions.FetchInfo());
  //     }
  //   });
  //   this.actions$
  //   .pipe(
  //     takeUntil(this.unsubs[1]),
  //     filter((action) => action.type === RTLActions.SET_INFO)
  //   ).subscribe((infoData: RTLActions.SetInfo) => {
  //     if (undefined !== infoData.payload.identity_pubkey) {
  //       this.initializeRemainingData();
  //     }
  //   });
  //   this.userIdle.startWatching();
  //   this.userIdle.onTimerStart().subscribe(count => {});
  //   this.userIdle.onTimeout().subscribe(() => {
  //     if (sessionStorage.getItem('token')) {
  //       this.logger.warn('Time limit exceeded for session inactivity! Logging out!');
  //       this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
  //         type: 'WARN',
  //         titleMessage: 'Time limit exceeded for session inactivity! Logging out!'
  //       }}));
  //       this.store.dispatch(new RTLActions.Signout());
  //       this.userIdle.resetTimer();
  //     }
  //   });
  // }

  // private readAccessKey() {
  //   const url = window.location.href;
  //   return url.substring(url.lastIndexOf('access-key=') + 11).trim();
  // }

  // initializeRemainingData() {
  //   this.store.dispatch(new RTLActions.FetchPeers());
  //   this.store.dispatch(new RTLActions.FetchBalance('channels'));
  //   this.store.dispatch(new RTLActions.FetchFees());
  //   this.store.dispatch(new RTLActions.FetchNetwork());
  //   this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'all'}));
  //   this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'pending'}));
  //   this.store.dispatch(new RTLActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
  //   this.store.dispatch(new RTLActions.FetchPayments());
  // }

  // ngAfterViewInit() {
  //   if (!this.settings.flgSidenavPinned) {
  //     this.sideNavigation.close();
  //     this.settingSidenav.toggle();
  //   }
  //   if (window.innerWidth <= 768) {
  //     this.sideNavigation.close();
  //     this.settingSidenav.toggle();
  //   }
  // }

  // @HostListener('window:resize')
  // public onWindowResize(): void {
  //   if (window.innerWidth <= 768) {
  //     this.settings.menu = 'Vertical';
  //     this.settings.flgSidenavOpened = false;
  //     this.settings.flgSidenavPinned = false;
  //   }
  // }

  // sideNavToggle() {
  //   this.sideNavigation.toggle();
  // }

  // onNavigationClicked(event: any) {
  //   if (window.innerWidth <= 414) {
  //     this.sideNavigation.close();
  //   }
  // }

  // copiedText(payload) {
  //   this.flgCopied = true;
  //   setTimeout(() => {this.flgCopied = false; }, 5000);
  //   this.logger.info('Copied Text: ' + payload);
  // }

  // ngOnDestroy() {
  //   this.unsubs.forEach(unsub => {
  //     unsub.next();
  //     unsub.complete();
  //   });
  // }
}
