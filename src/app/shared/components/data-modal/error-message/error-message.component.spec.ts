import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '../../../shared.module';
import { LoggerService } from '../../../services/logger.service';
import { mockLoggerService, mockMatDialogRef } from '../../../test-helpers/mock-services';
import { ErrorMessageComponent } from './error-message.component';

describe('ErrorMessageComponent', () => {
  let fixture: ComponentFixture<ErrorMessageComponent>;
  const message = 'Payment not sent. Nothing was paid. The cheapest route LND found costs 500,000 Sats in fees, more than the default max fee of 500 Sats.';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule],
      providers: [
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { alertTitle: 'Send Payment Failed', message: { code: 500, message: message, URL: './api/lnd/payments/send' } } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorMessageComponent);
    fixture.detectChanges();
  });

  it('should show the amounts in the error message in bold', () => {
    const errorText = fixture.nativeElement.querySelectorAll('span.word-break')[0];
    expect(Array.from<HTMLElement>(errorText.querySelectorAll('strong')).map((bold) => bold.textContent)).toEqual(['500,000 Sats', '500 Sats']);
    expect(errorText.textContent.trim()).toEqual(message);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
