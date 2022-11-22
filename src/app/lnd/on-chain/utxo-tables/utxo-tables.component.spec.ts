import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { LoggerService } from '../../../shared/services/logger.service';

import { UTXOTablesComponent } from './utxo-tables.component';
import { OnChainTransactionHistoryComponent } from './on-chain-transaction-history/on-chain-transaction-history.component';
import { mockDataService, mockLoggerService, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { CommonService } from '../../../shared/services/common.service';
import { SharedModule } from '../../../shared/shared.module';
import { OnChainUTXOsComponent } from './utxos/utxos.component';
import { DataService } from '../../../shared/services/data.service';
import { RTLEffects } from '../../../store/rtl.effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('UTXOTablesComponent', () => {
  let component: UTXOTablesComponent;
  let fixture: ComponentFixture<UTXOTablesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UTXOTablesComponent, OnChainTransactionHistoryComponent, OnChainUTXOsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UTXOTablesComponent);
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
