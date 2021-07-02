import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../../shared/shared.module';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLOnChainComponent } from './on-chain.component';
import { CLOnChainUtxosComponent } from './utxo-tables/utxos/utxos.component';
import { CLOnChainSendComponent } from './on-chain-send/on-chain-send.component';
import { CLOnChainReceiveComponent } from './on-chain-receive/on-chain-receive.component';
import { CurrencyUnitConverterComponent } from '../../shared/components/currency-unit-converter/currency-unit-converter.component';
import { CommonService } from '../../shared/services/common.service';
import { mockCommonService } from '../../shared/services/test-consts';
import { CLUTXOTablesComponent } from './utxo-tables/utxo-tables.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CLOnChainComponent', () => {
  let component: CLOnChainComponent;
  let fixture: ComponentFixture<CLOnChainComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainComponent, CurrencyUnitConverterComponent, CLUTXOTablesComponent, CLOnChainUtxosComponent, CLOnChainSendComponent, CLOnChainReceiveComponent ],
      imports: [ 
        BrowserAnimationsModule,
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
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainComponent);
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
