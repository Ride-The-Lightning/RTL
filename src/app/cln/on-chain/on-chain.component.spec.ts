import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../../shared/shared.module';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../cln/store/cln.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { CLNOnChainComponent } from './on-chain.component';
import { CLNOnChainUtxosComponent } from './utxo-tables/utxos/utxos.component';
import { CLNOnChainSendComponent } from './on-chain-send/on-chain-send.component';
import { CLNOnChainReceiveComponent } from './on-chain-receive/on-chain-receive.component';
import { CurrencyUnitConverterComponent } from '../../shared/components/currency-unit-converter/currency-unit-converter.component';
import { CommonService } from '../../shared/services/common.service';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { CLNUTXOTablesComponent } from './utxo-tables/utxo-tables.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../shared/services/data.service';

describe('CLNOnChainComponent', () => {
  let component: CLNOnChainComponent;
  let fixture: ComponentFixture<CLNOnChainComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNOnChainComponent, CurrencyUnitConverterComponent, CLNUTXOTablesComponent, CLNOnChainUtxosComponent, CLNOnChainSendComponent, CLNOnChainReceiveComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNOnChainComponent);
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
