import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { SharedModule } from '../../../../shared/shared.module';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../../shared/test-helpers/mock-services';

import { CLNCreateInvoiceComponent } from './create-invoice.component';

describe('CLNCreateInvoiceComponent', () => {
  let component: CLNCreateInvoiceComponent;
  let fixture: ComponentFixture<CLNCreateInvoiceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNCreateInvoiceComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        DecimalPipe,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { pageSize: 10 } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNCreateInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the amount in the other currency when it changes without a key press', async () => {
    component.selNode = <any>{ settings: { fiatConversion: true, currencyUnits: ['Sats', 'BTC', 'USD'] } };
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="invoiceValue"]');
    input.value = '10000';
    input.dispatchEvent(new Event('input'));
    // 10,000 Sats at the mocked rate of 33,438.82 USD per BTC.
    expect(component.invoiceValueHint).toBe('3.34 USD');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
