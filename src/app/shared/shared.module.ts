import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatExpansionModule, MatGridListModule, MatDatepickerModule,
  MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule, MatTreeModule, MatNativeDateModule,
  MatSelectModule, MatSidenavModule, MatSlideToggleModule, MatSortModule, MatTableModule, MatToolbarModule, MatTooltipModule, MAT_DIALOG_DEFAULT_OPTIONS, MatBadgeModule,
  MatPaginatorModule, MatStepperModule, MatSliderModule, MatTabsModule, MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS
} from '@angular/material';

import { QRCodeModule } from 'angularx-qrcode';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
  suppressScrollY: false
};

import { CLInvoiceInformationComponent } from './components/data-modal/invoice-information-cl/invoice-information.component';
import { InvoiceInformationComponent } from './components/data-modal/invoice-information-lnd/invoice-information.component';
import { OnChainGeneratedAddressComponent } from './components/data-modal/on-chain-generated-address/on-chain-generated-address.component';
import { AppSettingsComponent } from './components/settings/app-settings/app-settings.component';
import { AlertMessageComponent } from './components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from './components/data-modal/error-message/error-message.component';
import { SpinnerDialogComponent } from './components/data-modal/spinner-dialog/spinner-dialog.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SigninComponent } from './components/signin/signin.component';
import { HelpComponent } from './components/help/help.component';
import { SideNavigationComponent } from './components/navigation/side-navigation/side-navigation.component';
import { TopMenuComponent } from './components/navigation/top-menu/top-menu.component';
import { HorizontalNavigationComponent } from './components/navigation/horizontal-navigation/horizontal-navigation.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ServerConfigComponent } from './components/settings/server-config/server-config.component';
import { ErrorComponent } from './components/error/error.component';
import { CurrencyUnitConverterComponent } from './components/currency-unit-converter/currency-unit-converter.component';
import { CLOpenChannelComponent } from './components/data-modal/open-channel-cl/open-channel.component';
import { OpenChannelComponent } from './components/data-modal/open-channel-lnd/open-channel.component';
import { ShowPubkeyComponent } from './components/data-modal/show-pubkey/show-pubkey.component';
import { ClipboardDirective } from './directive/clipboard.directive';
import { AutoFocusDirective } from './directive/auto-focus.directive';
import { NonNegativeAmountValidator } from './directive/non-negative-amount.directive';
import { RemoveLeadingZerosPipe } from './pipes/app.pipe';

import { LoggerService, ConsoleLoggerService } from '../shared/services/logger.service';
import { SocketService } from './services/socket.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FlexLayoutModule,
    LayoutModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTreeModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatPaginatorModule,
    MatStepperModule,
    MatSliderModule,
    MatTabsModule,
    MatSnackBarModule,
    QRCodeModule,
    RouterModule,
    HttpClientModule,
    PerfectScrollbarModule
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FlexLayoutModule,
    LayoutModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTreeModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatPaginatorModule,
    MatStepperModule,
    MatSliderModule,
    MatTabsModule,
    MatSnackBarModule,
    AppSettingsComponent,
    SettingsComponent,
    CLInvoiceInformationComponent,
    InvoiceInformationComponent,
    CLOpenChannelComponent,
    OpenChannelComponent,
    OnChainGeneratedAddressComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent,
    SpinnerDialogComponent,
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    HorizontalNavigationComponent,
    SigninComponent,
    HelpComponent,
    ServerConfigComponent,
    CurrencyUnitConverterComponent,
    ClipboardDirective,
    AutoFocusDirective,
    NonNegativeAmountValidator,
    QRCodeModule,
    RemoveLeadingZerosPipe,
    PerfectScrollbarModule
  ],
  declarations: [
    AppSettingsComponent,
    SettingsComponent,
    CLInvoiceInformationComponent,
    InvoiceInformationComponent,
    OnChainGeneratedAddressComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent,
    SpinnerDialogComponent,
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    HorizontalNavigationComponent,
    SigninComponent,
    HelpComponent,
    ServerConfigComponent,
    CurrencyUnitConverterComponent,
    ErrorComponent,
    ClipboardDirective,
    AutoFocusDirective,
    NonNegativeAmountValidator,
    RemoveLeadingZerosPipe,
    CLOpenChannelComponent,
    OpenChannelComponent,
    ShowPubkeyComponent
  ],
  entryComponents: [
    CLInvoiceInformationComponent,
    InvoiceInformationComponent,
    OnChainGeneratedAddressComponent,
    CLOpenChannelComponent,
    OpenChannelComponent,
    ShowPubkeyComponent,
    SpinnerDialogComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: true, disableClose: true, role: 'dialog', width: '55%' } },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2000, verticalPosition: 'bottom', panelClass: 'rtl-snack-bar' } },
    DecimalPipe, TitleCasePipe, SocketService
  ]
})
export class SharedModule { }
