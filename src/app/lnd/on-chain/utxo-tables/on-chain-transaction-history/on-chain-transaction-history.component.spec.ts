import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { OnChainTransactionHistoryComponent } from './on-chain-transaction-history.component';

describe('OnChainTransactionHistoryComponent', () => {
  let component: OnChainTransactionHistoryComponent;
  let fixture: ComponentFixture<OnChainTransactionHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainTransactionHistoryComponent ],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
 ],
      providers: [ LoggerService, CommonService, DatePipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainTransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
