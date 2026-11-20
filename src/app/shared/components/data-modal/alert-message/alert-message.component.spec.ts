import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideMockStore } from '@ngrx/store/testing';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';
import { DataService } from '../../../services/data.service';
import { AlertTypeEnum, DataTypeEnum } from '../../../services/consts-enums-functions';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../test-helpers/mock-services';
import { mockRTLStoreState } from '../../../test-helpers/test-data';
import { SharedModule } from '../../../shared.module';

import { AlertMessageComponent } from './alert-message.component';

describe('AlertMessageComponent', () => {
  let fixture: ComponentFixture<AlertMessageComponent>;

  // The dialog content as the operator sees it, with one list field.
  const renderWithList = (field: { key: string, value: string[], preformatted?: boolean }) => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SharedModule, RouterTestingModule],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { type: AlertTypeEnum.INFORMATION, alertTitle: 'HTLC Information', message: [[{ ...field, title: 'Hops', width: 100, type: DataTypeEnum.ARRAY }]] } },
        provideMockStore({ initialState: mockRTLStoreState })
      ]
    });
    fixture = TestBed.createComponent(AlertMessageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  // A list entry is a string from the node or from RTL; the dialog shows it as that string.
  it('shows each entry of a list field as the text it is', () => {
    const entries = ['Channel: <b>node</b> <img src="x.png"> &amp; more', 'Channel: carol'];
    const container = renderWithList({ key: 'hops', value: entries });
    const shown = Array.from(container.querySelectorAll('.list-entry')).map((entry) => entry.textContent);
    expect(shown).toEqual(entries);
    expect(container.querySelectorAll('.list-entry *').length).toBe(0);
  });

  it('keeps the spacing of a preformatted list field', () => {
    const container = renderWithList({ key: 'hops', value: ['Channel: bob                 \t\t\tAmount (Sats): 20,000'], preformatted: true });
    const entry = container.querySelector('.list-entry') as HTMLElement;
    expect(entry.textContent).toBe('Channel: bob                 \t\t\tAmount (Sats): 20,000');
    expect(getComputedStyle(entry).whiteSpace).toBe('pre');
    expect(getComputedStyle(entry).fontFamily).toContain('monospace');
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });
});
