import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { DataService } from '../../../../shared/services/data.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SharedModule } from '../../../../shared/shared.module';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockLoggerService, mockMatDialogRef, mockRTLEffects } from '../../../../shared/test-helpers/mock-services';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../../clightning/store/cl.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CLBumpFeeComponent } from './bump-fee.component';

describe('CLBumpFeeComponent', () => {
  let component: CLBumpFeeComponent;
  let fixture: ComponentFixture<CLBumpFeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CLBumpFeeComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: {} } },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CLBumpFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
