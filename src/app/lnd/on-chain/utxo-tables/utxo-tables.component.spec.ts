import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { LoggerService } from '../../../shared/services/logger.service';

import { UTXOTablesComponent } from './utxo-tables.component';
import { OnChainTransactionHistoryComponent } from './on-chain-transaction-history/on-chain-transaction-history.component';
import { mockDataService, mockRTLEffects } from '../../../shared/test-helpers/test-consts';
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
      declarations: [ UTXOTablesComponent, OnChainTransactionHistoryComponent, OnChainUTXOsComponent ],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService, CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(UTXOTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
