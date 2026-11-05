import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { OnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';
import { mockDataService, mockLoggerService } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../shared/services/data.service';
import { openAlert } from '../../../../store/rtl.actions';
import { OnChainLabelModalComponent } from '../../on-chain-label-modal/on-chain-label-modal.component';

describe('OnChainTransactionHistoryComponent', () => {
  let component: OnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<OnChainTransactionHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnChainTransactionHistoryComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the label modal for the selected transaction', () => {
    const storeSpy = spyOn(TestBed.inject(Store), 'dispatch');
    const transaction = { tx_hash: 'ab'.repeat(32), amount: '5000', num_confirmations: 2 };
    component.onLabelTransaction(transaction);
    expect(storeSpy).toHaveBeenCalledWith(openAlert({ payload: { data: { transaction: transaction, component: OnChainLabelModalComponent } } }));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
