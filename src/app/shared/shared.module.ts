import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LayoutModule } from '@angular/cdk/layout';
import {
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatExpansionModule, MatGridListModule, MatDatepickerModule,
  MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule, MatTreeModule, MatNativeDateModule,
  MatSelectModule, MatSidenavModule, MatSlideToggleModule, MatSortModule, MatTableModule, MatToolbarModule, MatTooltipModule, MatBadgeModule,
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
import { AuthSettingsComponent } from './components/settings/auth-settings/auth-settings.component';
import { LoopQuoteComponent } from '../lnd/loop/loop-quote/loop-quote.component';
import { ClipboardDirective } from './directive/clipboard.directive';
import { AutoFocusDirective } from './directive/auto-focus.directive';
import { MaxValidator } from './directive/max-amount.directive';
import { MinValidator } from './directive/min-amount.directive';
import { RemoveLeadingZerosPipe } from './pipes/app.pipe';

import { LoggerService, ConsoleLoggerService } from '../shared/services/logger.service';
import { LoopStatusComponent } from '../lnd/loop/loop-status/loop-status.component';
import { LoopTransactionDetailsComponent } from '../lnd/loop/loop-transaction-details/loop-transaction-details.component';
import { LoopOutInfoGraphicsComponent } from '../lnd/loop/loop-out-info-graphics/info-graphics.component';
import { LoopInInfoGraphicsComponent } from '../lnd/loop/loop-in-info-graphics/info-graphics.component';

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
    NotFoundComponent,
    SideNavigationComponent,
    TopMenuComponent,
    LoginComponent,
    HelpComponent,
    ServerConfigComponent,
    CurrencyUnitConverterComponent,
    ClipboardDirective,
    AutoFocusDirective,
    MaxValidator,
    MinValidator,
    QRCodeModule,
    RemoveLeadingZerosPipe,
    PerfectScrollbarModule,
    LoopQuoteComponent,
    LoopStatusComponent,
    LoopTransactionDetailsComponent,
    LoopOutInfoGraphicsComponent,
    LoopInInfoGraphicsComponent
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
    ErrorComponent,
    ClipboardDirective,
    AutoFocusDirective,
    MaxValidator,
    MinValidator,
    RemoveLeadingZerosPipe,
    AuthSettingsComponent,
    LoopQuoteComponent,
    LoopStatusComponent,
    LoopTransactionDetailsComponent,
    LoopOutInfoGraphicsComponent,
    LoopInInfoGraphicsComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2000, verticalPosition: 'bottom', panelClass: 'rtl-snack-bar' } },
    DecimalPipe, TitleCasePipe
  ]
})
export class SharedModule { }
