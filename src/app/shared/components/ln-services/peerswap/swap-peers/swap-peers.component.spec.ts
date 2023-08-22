import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../services/logger.service';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../../test-helpers/mock-services';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../services/data.service';
import { PSPeersComponent } from './swap-peers.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('PSPeersComponent', () => {
  let component: PSPeersComponent;
  let fixture: ComponentFixture<PSPeersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PSPeersComponent],
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { sweepAll: true } },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PSPeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
