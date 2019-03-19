import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
    MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatExpansionModule, MatGridListModule, MatDatepickerModule,
    MatIconModule, MatInputModule, MatListModule, MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule, MatTreeModule, MatNativeDateModule,
    MatSelectModule, MatSidenavModule, MatSlideToggleModule, MatSortModule, MatTableModule, MatToolbarModule, MatTooltipModule, MAT_DIALOG_DEFAULT_OPTIONS, MatBadgeModule
} from '@angular/material';
import { QRCodeModule } from 'angularx-qrcode';
import { AlertMessageComponent } from './components/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from './components/confirmation-message/confirmation-message.component';
import { SpinnerDialogComponent } from './components/spinner-dialog/spinner-dialog.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { SettingsNavComponent } from './components/settings-nav/settings-nav.component';
import { ClipboardDirective } from './directive/clipboard.directive';
import { SsoFailedComponent } from './components/sso-failed/sso-failed.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
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
        QRCodeModule
    ],
    exports: [
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
        AlertMessageComponent,
        ConfirmationMessageComponent,
        SpinnerDialogComponent,
        NotFoundComponent,
        SettingsNavComponent,
        ClipboardDirective,
        QRCodeModule
    ],
    declarations: [
        AlertMessageComponent,
        ConfirmationMessageComponent,
        SpinnerDialogComponent,
        NotFoundComponent,
        SettingsNavComponent,
        ClipboardDirective,
        SsoFailedComponent
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
