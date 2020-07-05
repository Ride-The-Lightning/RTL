import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { UserIdleModule } from 'angular-user-idle';
import { OverlayContainer } from '@angular/cdk/overlay';
import { routing } from './app.routing';
import { SharedModule } from './shared/shared.module';
import { ThemeOverlay } from './shared/theme/overlay-container/theme-overlay';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';
import { SessionService } from './shared/services/session.service';
import { CommonService } from './shared/services/common.service';
import { LoopService } from './shared/services/loop.service';
import { DataService } from './shared/services/data.service';
import { LoggerService, ConsoleLoggerService } from './shared/services/logger.service';
import { AuthGuard } from './shared/services/auth.guard';
import { AuthInterceptor } from './shared/services/auth.interceptor';

import { RTLReducer } from './store/rtl.reducers';
import { RTLEffects } from './store/rtl.effects';
import { LNDEffects } from './lnd/store/lnd.effects';
import { CLEffects } from './clightning/store/cl.effects';
import { ECLREffects } from './eclair/store/eclr.effects';
import { LayoutModule } from '@angular/cdk/layout';
import { CLOpenChannelComponent } from './clightning/peers-channels/channels/open-channel-modal/open-channel.component';
import { CLChannelInformationComponent } from './clightning/peers-channels/channels/channel-information-modal/channel-information.component';
import { CLInvoiceInformationComponent } from './clightning/transactions/invoice-information-modal/invoice-information.component';
import { CLConnectPeerComponent } from './clightning/peers-channels/connect-peer/connect-peer.component';
import { CLLightningSendPaymentsComponent } from './clightning/transactions/send-payment-modal/send-payment.component';
import { CLCreateInvoiceComponent } from './clightning/transactions/create-invoice-modal/create-invoice.component';
import { CLOnChainSendComponent } from './clightning/on-chain/on-chain-send-modal/on-chain-send.component';
import { InvoiceInformationComponent } from './lnd/transactions/invoice-information-modal/invoice-information.component';
import { ChannelRebalanceComponent } from './lnd/peers-channels/channels/channel-rebalance-modal/channel-rebalance.component';
import { CloseChannelComponent } from './lnd/peers-channels/channels/close-channel-modal/close-channel.component';
import { OpenChannelComponent } from './lnd/peers-channels/channels/open-channel-modal/open-channel.component';
import { ChannelInformationComponent } from './lnd/peers-channels/channels/channel-information-modal/channel-information.component';
import { OnChainSendComponent } from './lnd/on-chain/on-chain-send-modal/on-chain-send.component';
import { LightningSendPaymentsComponent } from './lnd/transactions/send-payment-modal/send-payment.component';
import { CreateInvoiceComponent } from './lnd/transactions/create-invoice-modal/create-invoice.component';
import { ConnectPeerComponent } from './lnd/peers-channels/connect-peer/connect-peer.component';
import { ShowPubkeyComponent } from './shared/components/data-modal/show-pubkey/show-pubkey.component';
import { OnChainGeneratedAddressComponent } from './shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';
import { SpinnerDialogComponent } from './shared/components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from './shared/components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './shared/components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from './shared/components/data-modal/error-message/error-message.component';
import { LoopModalComponent } from './lnd/loop/loop-modal/loop-modal.component';
import { TwoFactorAuthComponent } from './shared/components/data-modal/two-factor-auth/two-factor-auth.component';
import { LoginTokenComponent } from './shared/components/data-modal/login-2fa-token/login-2fa-token.component';
import { ECLRInvoiceInformationComponent } from './eclair/transactions/invoice-information-modal/invoice-information.component';
import { ECLRPaymentInformationComponent } from './eclair/transactions/payment-information-modal/payment-information.component';
import { ECLROpenChannelComponent } from './eclair/peers-channels/channels/open-channel-modal/open-channel.component';
import { ECLRConnectPeerComponent } from './eclair/peers-channels/connect-peer/connect-peer.component';
import { ECLRLightningSendPaymentsComponent } from './eclair/transactions/send-payment-modal/send-payment.component';
import { ECLRCreateInvoiceComponent } from './eclair/transactions/create-invoice-modal/create-invoice.component';
import { ECLROnChainSendComponent } from './eclair/on-chain/on-chain-send-modal/on-chain-send.component';
import { ECLRChannelInformationComponent } from './eclair/peers-channels/channels/channel-information-modal/channel-information.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    routing,
    UserIdleModule.forRoot({idle: 60 * 60, timeout: 1, ping: null}),
    StoreModule.forRoot(RTLReducer, {
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false
      }
    }),
    EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects, ECLREffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    LayoutModule,
    MatDialogModule,
    HammerModule
  ],
  declarations: [
    AppComponent,
    InvoiceInformationComponent,
    ChannelRebalanceComponent,
    OnChainGeneratedAddressComponent,
    OpenChannelComponent,
    ChannelInformationComponent,
    LightningSendPaymentsComponent,
    ConnectPeerComponent,
    ShowPubkeyComponent,
    SpinnerDialogComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent,
    CloseChannelComponent,
    LoopModalComponent,
    TwoFactorAuthComponent,
    LoginTokenComponent,
    CreateInvoiceComponent,
    OnChainSendComponent,
    CLInvoiceInformationComponent,
    CLOpenChannelComponent,
    CLConnectPeerComponent,
    CLLightningSendPaymentsComponent,
    CLCreateInvoiceComponent,
    CLOnChainSendComponent,
    CLChannelInformationComponent,
    ECLRInvoiceInformationComponent,
    ECLRPaymentInformationComponent,
    ECLROpenChannelComponent,
    ECLRConnectPeerComponent,
    ECLRLightningSendPaymentsComponent,
    ECLRCreateInvoiceComponent,
    ECLROnChainSendComponent,
    ECLRChannelInformationComponent
  ],
  entryComponents: [
    SpinnerDialogComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent,
    ShowPubkeyComponent,
    TwoFactorAuthComponent,
    LoginTokenComponent,
    OnChainGeneratedAddressComponent,
    CloseChannelComponent,
    LoopModalComponent,
    InvoiceInformationComponent,
    ChannelRebalanceComponent,
    OpenChannelComponent,
    ConnectPeerComponent,
    LightningSendPaymentsComponent,
    CreateInvoiceComponent,
    OnChainSendComponent,
    ChannelInformationComponent,
    CLInvoiceInformationComponent,
    CLOpenChannelComponent,
    CLConnectPeerComponent,
    CLLightningSendPaymentsComponent,
    CLCreateInvoiceComponent,
    CLOnChainSendComponent,
    CLChannelInformationComponent,
    ECLRInvoiceInformationComponent,
    ECLRPaymentInformationComponent,
    ECLROpenChannelComponent,
    ECLRConnectPeerComponent,
    ECLRLightningSendPaymentsComponent,
    ECLRCreateInvoiceComponent,
    ECLROnChainSendComponent,
    ECLRChannelInformationComponent
  ],  
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: OverlayContainer, useClass: ThemeOverlay },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: true, disableClose: true, role: 'dialog', width: '55%' } },
    CommonService, AuthGuard, SessionService, DataService, LoopService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
