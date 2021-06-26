import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../shared/services/common.service';
import { DataService } from '../../shared/services/data.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockCommonService, mockDataService, mockRTLEffects } from '../../shared/services/test-consts';
import { SharedModule } from '../../shared/shared.module';
import { RTLEffects } from '../../store/rtl.effects';

import { RTLReducer } from '../../store/rtl.reducers';
import { OnChainComponent } from './on-chain.component';
import { OnChainTransactionHistoryComponent } from './utxo-tables/on-chain-transaction-history/on-chain-transaction-history.component';
import { UTXOTablesComponent } from './utxo-tables/utxo-tables.component';
import { OnChainUTXOsComponent } from './utxo-tables/utxos/utxos.component';

describe('OnChainComponent', () => {
  let component: OnChainComponent;
  let fixture: ComponentFixture<OnChainComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainComponent, UTXOTablesComponent, OnChainTransactionHistoryComponent, OnChainUTXOsComponent ],
      imports: [ 
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService,
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: DataService, useClass: mockDataService },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainComponent);
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
