import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatExpansionModule, MatGridListModule, MatDatepickerModule,
  MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule, MatTreeModule, MatNativeDateModule,
  MatSelectModule, MatSidenavModule, MatSlideToggleModule, MatSortModule, MatTableModule, MatToolbarModule, MatTooltipModule, MAT_DIALOG_DEFAULT_OPTIONS, MatBadgeModule,
  MatPaginatorModule, MatStepperModule, MatSliderModule, MatTabsModule
} from '@angular/material';

import { QRCodeModule } from 'angularx-qrcode';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { AppSettingsComponent } from './components/app-settings/app-settings.component';
import { AlertMessageComponent } from './components/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './components/confirmation-message/confirmation-message.component';
import { SpinnerDialogComponent } from './components/spinner-dialog/spinner-dialog.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SigninComponent } from './components/signin/signin.component';
import { HelpComponent } from './components/help/help.component';
import { SideNavigationComponent } from './components/navigation/side-navigation/side-navigation.component';
import { TopMenuComponent } from './components/navigation/top-menu/top-menu.component';
import { HorizontalNavigationComponent } from './components/navigation/horizontal-navigation/horizontal-navigation.component';
import { ServerConfigComponent } from './components/server-config/server-config.component';
import { ErrorComponent } from './components/error/error.component';
import { CurrencyUnitConverterComponent } from './components/currency-unit-converter/currency-unit-converter.component';
import { ClipboardDirective } from './directive/clipboard.directive';
import { RemoveLeadingZerosPipe, CurrencyUnitConvertPipe } from './pipes/app.pipe';
import { CommonService } from './services/common.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FlexLayoutModule,
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
    QRCodeModule,
    NgxChartsModule,
    RouterModule,
    HttpClientModule
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FlexLayoutModule,
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
    AppSettingsComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
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
    QRCodeModule,
    NgxChartsModule,
    RemoveLeadingZerosPipe,
    CurrencyUnitConvertPipe
  ],
  declarations: [
    AppSettingsComponent,
    AlertMessageComponent,
    ConfirmationMessageComponent,
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
    RemoveLeadingZerosPipe,
    CurrencyUnitConvertPipe
  ],
  entryComponents: [
    AlertMessageComponent,
    SpinnerDialogComponent,
    ConfirmationMessageComponent
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: true, disableClose: true, role: 'dialog', width: '700px' } },
    CommonService
  ]
})
export class SharedModule { }
