import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLOnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockCommonService } from '../../../shared/services/test-consts';

describe('ECLOnChainTransactionHistoryComponent', () => {
  let component: ECLOnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<ECLOnChainTransactionHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLOnChainTransactionHistoryComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
      ],
      providers: [ 
        LoggerService,
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainTransactionHistoryComponent);
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
