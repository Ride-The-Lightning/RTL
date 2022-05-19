import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CLNOpenLiquidityChannelComponent } from './open-liquidity-channel-modal.component';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

describe('CLNOpenLiquidityChannelComponent', () => {
  let component: CLNOpenLiquidityChannelComponent;
  let fixture: ComponentFixture<CLNOpenLiquidityChannelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNOpenLiquidityChannelComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        {
          provide: MAT_DIALOG_DATA, useValue: {
            message: {
              node: {
                nodeid: '0263983b2261d6ad9e2e134c1aa60d0c82d47c1c16b876a096a38d4f283fc236dc',
                alias: 'blyte c-lightning',
                color: '026398',
                last_timestamp: 1640062643,
                features: '800088282a6aa2',
                addresses: [
                  {
                    type: 'ipv4',
                    address: '172.105.98.46',
                    port: 9747
                  }
                ],
                option_will_fund: {
                  lease_fee_base_msat: '20000000',
                  lease_fee_basis: 50,
                  funding_weight: 666,
                  channel_fee_max_base_msat: '0',
                  channel_fee_max_proportional_thousandths: 1,
                  compact_lease: '029a0032000100004e20'
                },
                channelOpeningFee: 22165
              },
              balance: 100000, requestedAmount: 20000, feeRate: 10, localAmount: 20000
            }
          }
        }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNOpenLiquidityChannelComponent);
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
