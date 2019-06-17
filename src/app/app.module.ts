import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { UserIdleModule } from 'angular-user-idle';

import { OverlayContainer } from '@angular/cdk/overlay';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false
};

import { environment } from '../environments/environment';
import { routing } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { ThemeOverlay } from './shared/theme/overlay-container/theme-overlay';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { PeersComponent } from './pages/peers/peers.component';
import { SendReceiveTransComponent } from './pages/transactions/send-receive/send-receive-trans.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { ServerConfigComponent } from './pages/server-config/server-config.component';
import { HelpComponent } from './pages/help/help.component';
import { UnlockLNDComponent } from './pages/unlock-lnd/unlock-lnd.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { SideNavigationComponent } from './pages/navigation/side-navigation/side-navigation.component';
import { TopMenuComponent } from './pages/navigation/top-menu/top-menu.component';
import { HorizontalNavigationComponent } from './pages/navigation/horizontal-navigation/horizontal-navigation.component';
import { ChannelManageComponent } from './pages/channels/channel-manage/channel-manage.component';
import { ChannelPendingComponent } from './pages/channels/channel-pending/channel-pending.component';
import { SigninComponent } from './pages/signin/signin.component';

import { RTLRootReducer } from './shared/store/rtl.reducers';
import { RTLEffects } from './shared/store/rtl.effects';

import { CommonService } from './shared/services/common.service';
import { LoggerService, ConsoleLoggerService } from './shared/services/logger.service';
import { AuthGuard, LNDUnlockedGuard } from './shared/services/auth.guard';
import { AuthInterceptor } from './shared/services/auth.interceptor';
import { ChannelClosedComponent } from './pages/channels/channel-closed/channel-closed.component';
import { ListTransactionsComponent } from './pages/transactions/list-transactions/list-transactions.component';
import { LookupsComponent } from './pages/lookups/lookups.component';
import { ForwardingHistoryComponent } from './pages/switch/forwarding-history.component';
import { RoutingPeersComponent } from './pages/routing-peers/routing-peers.component';
import { ChannelLookupComponent } from './pages/lookups/channel-lookup/channel-lookup.component';
import { NodeLookupComponent } from './pages/lookups/node-lookup/node-lookup.component';
import { ChannelBackupComponent } from './pages/channels/channel-backup/channel-backup.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PerfectScrollbarModule,
    SharedModule,
    NgxChartsModule,
    routing,
    UserIdleModule.forRoot({idle: 60 * 60, timeout: 1, ping: null}),
    StoreModule.forRoot({rtlRoot: RTLRootReducer}),
    EffectsModule.forRoot([RTLEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : []
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    PeersComponent,
    SendReceiveTransComponent,
    InvoicesComponent,
    ServerConfigComponent,
    HelpComponent,
    UnlockLNDComponent,
    PaymentsComponent,
    SideNavigationComponent,
    TopMenuComponent,
    HorizontalNavigationComponent,
    ChannelManageComponent,
    ChannelPendingComponent,
    SigninComponent,
    ChannelClosedComponent,
    ListTransactionsComponent,
    LookupsComponent,
    ForwardingHistoryComponent,
    RoutingPeersComponent,
    ChannelLookupComponent,
    NodeLookupComponent,
    ChannelBackupComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
    { provide: OverlayContainer, useClass: ThemeOverlay },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthGuard, LNDUnlockedGuard, CommonService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
