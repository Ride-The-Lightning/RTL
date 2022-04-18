import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../../cln/store/cl.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { DataService } from '../../../../shared/services/data.service';

import { OnChainUTXOsComponent } from './utxos.component';
import { SharedModule } from '../../../../shared/shared.module';
import { mockDataService, mockLoggerService, mockRTLEffects } from '../../../../shared/test-helpers/mock-services';
import { RTLEffects } from '../../../../store/rtl.effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('OnChainUTXOsComponent', () => {
  let component: OnChainUTXOsComponent;
  let fixture: ComponentFixture<OnChainUTXOsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnChainUTXOsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainUTXOsComponent);
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
