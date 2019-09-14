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
    MatPaginatorModule, MatStepperModule
} from '@angular/material';

import { QRCodeModule } from 'angularx-qrcode';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { AlertMessageComponent } from './components/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './components/confirmation-message/confirmation-message.component';
import { SpinnerDialogComponent } from './components/spinner-dialog/spinner-dialog.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SigninComponent } from './components/signin/signin.component';
import { HelpComponent } from './components/help/help.component';
import { SideNavigationComponent } from './components/navigation/side-navigation/side-navigation.component';
import { TopMenuComponent } from './components/navigation/top-menu/top-menu.component';
import { HorizontalNavigationComponent } from './components/navigation/horizontal-navigation/horizontal-navigation.component';
import { SettingsNavComponent } from './components/settings-nav/settings-nav.component';
import { ServerConfigComponent } from './components/server-config/server-config.component';
import { SsoFailedComponent } from './components/sso-failed/sso-failed.component';
import { ClipboardDirective } from './directive/clipboard.directive';
import { RemoveLeadingZerosPipe } from './pipes/remove-leading-zero.pipe';

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
        AlertMessageComponent,
        ConfirmationMessageComponent,
        SpinnerDialogComponent,
        NotFoundComponent,
        SettingsNavComponent,
        SideNavigationComponent,
        TopMenuComponent,
        HorizontalNavigationComponent,
        SigninComponent,
        HelpComponent,
        ServerConfigComponent,
        ClipboardDirective,
        QRCodeModule,
        NgxChartsModule,
        RemoveLeadingZerosPipe
    ],
    declarations: [
        AlertMessageComponent,
        ConfirmationMessageComponent,
        SpinnerDialogComponent,
        NotFoundComponent,
        SettingsNavComponent,
        SideNavigationComponent,
        TopMenuComponent,
        HorizontalNavigationComponent,
        SigninComponent,
        HelpComponent,
        ServerConfigComponent,
        ClipboardDirective,
        SsoFailedComponent,
        RemoveLeadingZerosPipe
    ],
    entryComponents: [
        AlertMessageComponent,
        SpinnerDialogComponent,
        ConfirmationMessageComponent
    ],
    providers: [
        { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: true, disableClose: true, role: 'dialog', width: '700px' } }
    ]
})
export class SharedModule { }
