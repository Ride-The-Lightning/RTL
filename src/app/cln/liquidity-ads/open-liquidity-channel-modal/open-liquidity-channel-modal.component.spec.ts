import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Store, StoreModule } from '@ngrx/store';
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
                channel_opening_fee: 22165
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

  const leaseCostText = () => fixture.nativeElement.querySelector('.alert-info').textContent;

  const enterValue = async (inputName: string, value: string) => {
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="' + inputName + '"]');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('should send the fee rate entered in sats/vByte as sats per 1000 vBytes', () => {
    const store = TestBed.inject(Store);
    const storeSpy = spyOn(store, 'dispatch');
    component.onOpenChannel();
    expect(storeSpy).toHaveBeenCalledTimes(1);
    expect((<any>storeSpy.calls.mostRecent().args[0]).payload.feeRate).toBe('10000perkb');
  });

  it('should show the lease cost for the amount and fee rate it opens with', () => {
    // 20,000 base + 20,000 * 50 / 10,000 + (666 / 4) * 10 = 21,765
    expect(leaseCostText()).toContain('21,765');
  });

  it('should update the lease cost when the requested amount changes without a key press', async () => {
    await enterValue('ramount', '30000');
    // 20,000 base + 30,000 * 50 / 10,000 + (666 / 4) * 10 = 21,815
    expect(leaseCostText()).toContain('21,815');
  });

  it('should update the lease cost when the fee rate changes without a key press', async () => {
    await enterValue('feerate', '20');
    // 20,000 base + 20,000 * 50 / 10,000 + (666 / 4) * 20 = 23,430
    expect(leaseCostText()).toContain('23,430');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
