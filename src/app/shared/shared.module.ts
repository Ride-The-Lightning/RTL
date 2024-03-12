import { NgModule, Injectable, Inject, Optional } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LayoutModule } from '@angular/cdk/layout';
import { Platform } from '@angular/cdk/platform';

import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter, MatDateFormats } from '@angular/material/core';
import { MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { MatChipsModule } from '@angular/material/chips';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { QrCodeModule } from 'ng-qrcode';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar-next';

import { ThemeOverlay } from './theme/overlay-container/theme-overlay';
import { OverlayContainer } from '@angular/cdk/overlay';
import { LoggerService, ConsoleLoggerService } from './services/logger.service';
import { MONTHS } from './services/consts-enums-functions';

import { NotFoundComponent } from './components/not-found/not-found.component';
import { LoginComponent } from './components/login/login.component';
import { HelpComponent } from './components/help/help.component';
import { SideNavigationComponent } from './components/navigation/side-navigation/side-navigation.component';
import { TopMenuComponent } from './components/navigation/top-menu/top-menu.component';
import { SettingsComponent } from './components/settings/settings.component';
import { BitcoinConfigComponent } from './components/settings/bitcoin-config/bitcoin-config.component';
import { AuthSettingsComponent } from './components/settings/auth-settings/auth-settings.component';
import { AppSettingsComponent } from './components/settings/app-settings/app-settings.component';
import { NodeConfigComponent } from './components/node-config/node-config.component';
import { LNPConfigComponent } from './components/node-config/lnp-config/lnp-config.component';
import { NodeSettingsComponent } from './components/node-config/node-settings/node-settings.component';
import { PageSettingsComponent } from './components/node-config/page-settings/page-settings.component';
import { ServicesSettingsComponent } from './components/node-config/services-settings/services-settings.component';
import { LoopServiceSettingsComponent } from './components/node-config/services-settings/loop-service-settings/loop-service-settings.component';
import { BoltzServiceSettingsComponent } from './components/node-config/services-settings/boltz-service-settings/boltz-service-settings.component';
import { PeerswapServiceSettingsComponent } from './components/node-config/services-settings/peerswap-service-settings/peerswap-service-settings.component';
import { NoServiceFoundComponent } from './components/node-config/services-settings/no-service-found/no-service-found.component';
import { ExperimentalSettingsComponent } from './components/node-config/experimental-settings/experimental-settings.component';
import { ErrorComponent } from './components/error/error.component';
import { CurrencyUnitConverterComponent } from './components/currency-unit-converter/currency-unit-converter.component';
import { HorizontalScrollerComponent } from './components/horizontal-scroller/horizontal-scroller.component';
import { TransactionsReportTableComponent } from './components/transactions-report-table/transactions-report-table.component';
import { ShowPubkeyComponent } from './components/data-modal/show-pubkey/show-pubkey.component';
import { OnChainGeneratedAddressComponent } from './components/data-modal/on-chain-generated-address/on-chain-generated-address.component';
import { SpinnerDialogComponent } from './components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from './components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from './components/data-modal/error-message/error-message.component';
import { IsAuthorizedComponent } from './components/data-modal/is-authorized/is-authorized.component';
import { TwoFactorAuthComponent } from './components/data-modal/two-factor-auth/two-factor-auth.component';
import { LoginTokenComponent } from './components/data-modal/login-2fa-token/login-2fa-token.component';

import { LNServicesComponent } from './components/ln-services/ln-services.component';
import { LoopComponent } from '../shared/components/ln-services/loop/loop.component';
import { SwapsComponent } from '../shared/components/ln-services/loop/swaps/swaps.component';
import { LoopModalComponent } from '../shared/components/ln-services/loop/loop-modal/loop-modal.component';
import { LoopQuoteComponent } from '../shared/components/ln-services/loop/loop-quote/loop-quote.component';
import { LoopStatusComponent } from '../shared/components/ln-services/loop/loop-status/loop-status.component';
import { LoopOutInfoGraphicsComponent } from '../shared/components/ln-services/loop/loop-out-info-graphics/info-graphics.component';
import { LoopInInfoGraphicsComponent } from '../shared/components/ln-services/loop/loop-in-info-graphics/info-graphics.component';
import { BoltzRootComponent } from './components/ln-services/boltz/boltz-root.component';
import { BoltzSwapsComponent } from './components/ln-services/boltz/swaps/swaps.component';
import { SwapStatusComponent } from './components/ln-services/boltz/swap-status/swap-status.component';
import { SwapServiceInfoComponent } from './components/ln-services/boltz/swap-service-info/swap-service-info.component';
import { SwapModalComponent } from './components/ln-services/boltz/swap-modal/swap-modal.component';
import { SwapInInfoGraphicsComponent } from './components/ln-services/boltz/swap-in-info-graphics/info-graphics.component';
import { SwapOutInfoGraphicsComponent } from './components/ln-services/boltz/swap-out-info-graphics/info-graphics.component';

import { ClipboardDirective } from './directive/clipboard.directive';
import { AutoFocusDirective } from './directive/auto-focus.directive';
import { MonthlyDateDirective, YearlyDateDirective } from './directive/date-formats.directive';
import { MaxValidator } from './directive/max-amount.directive';
import { MinValidator } from './directive/min-amount.directive';
import { RemoveLeadingZerosPipe, CamelCasePipe, CamelCaseWithReplacePipe, CamelCaseWithSpacesPipe } from './pipes/app.pipe';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
  suppressScrollY: false
};

@Injectable() class DefaultDateAdapter extends NativeDateAdapter {

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string) {
    super(matDateLocale);
  }

  format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      let day: string = date.getDate().toString();
      day = +day < 10 ? '0' + day : day;
      return day + '/' + MONTHS[date.getMonth()].name.toUpperCase() + '/' + date.getFullYear();
    }
    return MONTHS[date.getMonth()].name.toUpperCase() + ' ' + date.getFullYear();
  }

}

export const DEFAULT_DATE_FORMAT: MatDateFormats = {
  parse: {
    dateInput: { day: 'numeric', month: 'short', year: 'numeric' }
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: 'numeric', month: 'short', year: 'numeric' },
    monthYearA11yLabel: { month: 'short', year: 'numeric' }
  }
};

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FlexLayoutModule,
    LayoutModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
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
    MatChipsModule,
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
    MatAutocompleteModule,
    NgxChartsModule,
    QrCodeModule,
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
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
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
    MatChipsModule,
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
    MatAutocompleteModule,
    NgxChartsModule,
    QrCodeModule,
    PerfectScrollbarModule,
    ClipboardDirective,
    AutoFocusDirective,
    MonthlyDateDirective,
    YearlyDateDirective,
    RemoveLeadingZerosPipe,
    CamelCasePipe,
    CamelCaseWithReplacePipe,
    CamelCaseWithSpacesPipe,
    MaxValidator,
    MinValidator,
    AppSettingsComponent,
    SettingsComponent,
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    LoginComponent,
    HelpComponent,
    SettingsComponent,
    BitcoinConfigComponent,
    AuthSettingsComponent,
    AppSettingsComponent,
    NodeConfigComponent,
    LNPConfigComponent,
    NodeSettingsComponent,
    PageSettingsComponent,
    ServicesSettingsComponent,
    LoopServiceSettingsComponent,
    BoltzServiceSettingsComponent,
    PeerswapServiceSettingsComponent,
    NoServiceFoundComponent,
    ExperimentalSettingsComponent,
    CurrencyUnitConverterComponent,
    HorizontalScrollerComponent,
    TransactionsReportTableComponent,
    LNServicesComponent,
    LoopComponent,
    SwapsComponent,
    LoopModalComponent,
    LoopQuoteComponent,
    LoopStatusComponent,
    LoopInInfoGraphicsComponent,
    LoopOutInfoGraphicsComponent,
    BoltzRootComponent,
    BoltzSwapsComponent,
    SwapStatusComponent,
    SwapServiceInfoComponent,
    SwapModalComponent,
    SwapInInfoGraphicsComponent,
    SwapOutInfoGraphicsComponent
  ],
  declarations: [
    AppSettingsComponent,
    SettingsComponent,
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    LoginComponent,
    HelpComponent,
    SettingsComponent,
    BitcoinConfigComponent,
    AuthSettingsComponent,
    AppSettingsComponent,
    NodeConfigComponent,
    LNPConfigComponent,
    NodeSettingsComponent,
    PageSettingsComponent,
    ServicesSettingsComponent,
    LoopServiceSettingsComponent,
    BoltzServiceSettingsComponent,
    PeerswapServiceSettingsComponent,
    NoServiceFoundComponent,
    ExperimentalSettingsComponent,
    CurrencyUnitConverterComponent,
    HorizontalScrollerComponent,
    ErrorComponent,
    ClipboardDirective,
    AutoFocusDirective,
    MonthlyDateDirective,
    YearlyDateDirective,
    MaxValidator,
    MinValidator,
    RemoveLeadingZerosPipe,
    CamelCasePipe,
    CamelCaseWithReplacePipe,
    CamelCaseWithSpacesPipe,
    AuthSettingsComponent,
    TransactionsReportTableComponent,
    OnChainGeneratedAddressComponent,
    ShowPubkeyComponent,
    SpinnerDialogComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent,
    IsAuthorizedComponent,
    TwoFactorAuthComponent,
    LoginTokenComponent,
    TransactionsReportTableComponent,
    LNServicesComponent,
    LoopComponent,
    SwapsComponent,
    LoopModalComponent,
    LoopQuoteComponent,
    LoopStatusComponent,
    LoopInInfoGraphicsComponent,
    LoopOutInfoGraphicsComponent,
    BoltzRootComponent,
    BoltzSwapsComponent,
    SwapStatusComponent,
    SwapServiceInfoComponent,
    SwapModalComponent,
    SwapInInfoGraphicsComponent,
    SwapOutInfoGraphicsComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2000, verticalPosition: 'bottom', panelClass: 'rtl-snack-bar' } },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: true, disableClose: true, role: 'dialog' } },
    { provide: DateAdapter, useClass: DefaultDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DEFAULT_DATE_FORMAT },
    { provide: OverlayContainer, useClass: ThemeOverlay },
    DecimalPipe, TitleCasePipe, DatePipe, RemoveLeadingZerosPipe, CamelCasePipe, CamelCaseWithReplacePipe, CamelCaseWithSpacesPipe
  ]
})
export class SharedModule { }
