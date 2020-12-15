import { NgModule, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LayoutModule } from '@angular/cdk/layout';

import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter, MatDateFormats } from '@angular/material/core';
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

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { QRCodeModule } from 'angularx-qrcode';
import { DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { ThemeOverlay } from './theme/overlay-container/theme-overlay';
import { OverlayContainer } from '@angular/cdk/overlay';
import { LoggerService, ConsoleLoggerService } from './services/logger.service';
import { MONTHS } from './services/consts-enums-functions';

import { AppSettingsComponent } from './components/settings/app-settings/app-settings.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { LoginComponent } from './components/login/login.component';
import { HelpComponent } from './components/help/help.component';
import { SideNavigationComponent } from './components/navigation/side-navigation/side-navigation.component';
import { TopMenuComponent } from './components/navigation/top-menu/top-menu.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ServerConfigComponent } from './components/settings/server-config/server-config.component';
import { ErrorComponent } from './components/error/error.component';
import { CurrencyUnitConverterComponent } from './components/currency-unit-converter/currency-unit-converter.component';
import { HorizontalScrollerComponent } from './components/horizontal-scroller/horizontal-scroller.component';
import { AuthSettingsComponent } from './components/settings/auth-settings/auth-settings.component';
import { LoopQuoteComponent } from '../lnd/loop/loop-quote/loop-quote.component';
import { LoopStatusComponent } from '../lnd/loop/loop-status/loop-status.component';
import { LoopOutInfoGraphicsComponent } from '../lnd/loop/loop-out-info-graphics/info-graphics.component';
import { LoopInInfoGraphicsComponent } from '../lnd/loop/loop-in-info-graphics/info-graphics.component';
import { TransactionsReportTableComponent } from './components/transactions-report-table/transactions-report-table.component';
import { ShowPubkeyComponent } from './components/data-modal/show-pubkey/show-pubkey.component';
import { OnChainGeneratedAddressComponent } from './components/data-modal/on-chain-generated-address/on-chain-generated-address.component';
import { SpinnerDialogComponent } from './components/data-modal/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from './components/data-modal/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './components/data-modal/confirmation-message/confirmation-message.component';
import { ErrorMessageComponent } from './components/data-modal/error-message/error-message.component';
import { TwoFactorAuthComponent } from './components/data-modal/two-factor-auth/two-factor-auth.component';
import { LoginTokenComponent } from './components/data-modal/login-2fa-token/login-2fa-token.component';

import { ClipboardDirective } from './directive/clipboard.directive';
import { AutoFocusDirective } from './directive/auto-focus.directive';
import { MonthlyDateDirective, YearlyDateDirective } from './directive/date-formats.directive';
import { MaxValidator } from './directive/max-amount.directive';
import { MinValidator } from './directive/min-amount.directive';
import { RemoveLeadingZerosPipe } from './pipes/app.pipe';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
  suppressScrollY: false
};

@Injectable() class DefaultDateAdapter extends NativeDateAdapter {
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
    monthYearA11yLabel: { month: 'short', year: 'numeric' },
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
    AppSettingsComponent,
    SettingsComponent,
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    LoginComponent,
    HelpComponent,
    ServerConfigComponent,
    CurrencyUnitConverterComponent,
    HorizontalScrollerComponent,
    ClipboardDirective,
    AutoFocusDirective,
    MonthlyDateDirective,
    YearlyDateDirective,
    MaxValidator,
    MinValidator,
    NgxChartsModule,
    QRCodeModule,
    RemoveLeadingZerosPipe,
    PerfectScrollbarModule,
    LoopQuoteComponent,
    LoopStatusComponent,
    LoopOutInfoGraphicsComponent,
    LoopInInfoGraphicsComponent,
    TransactionsReportTableComponent
  ],
  declarations: [
    AppSettingsComponent,
    SettingsComponent,
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    LoginComponent,
    HelpComponent,
    ServerConfigComponent,
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
    AuthSettingsComponent,
    LoopQuoteComponent,
    LoopStatusComponent,
    LoopOutInfoGraphicsComponent,
    LoopInInfoGraphicsComponent,
    TransactionsReportTableComponent,
    OnChainGeneratedAddressComponent,
    ShowPubkeyComponent,
    SpinnerDialogComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
    ErrorMessageComponent,
    TwoFactorAuthComponent,
    LoginTokenComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2000, verticalPosition: 'bottom', panelClass: 'rtl-snack-bar' } },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: true, disableClose: true, role: 'dialog', width: '55%' } },
    { provide: DateAdapter, useClass: DefaultDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DEFAULT_DATE_FORMAT },
    { provide: OverlayContainer, useClass: ThemeOverlay },
    DecimalPipe, TitleCasePipe, DatePipe
  ]
})
export class SharedModule { }
