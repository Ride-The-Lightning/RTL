import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { DataService } from '../../../shared/services/data.service';
import { CommonService } from '../../../shared/services/common.service';
import { RTLEffects } from '../../../store/rtl.effects';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/test-helpers/mock-services';

import { CLNLiquidityAdsListComponent } from './liquidity-ads-list.component';

describe('CLNLiquidityAdsListComponent', () => {
  let component: CLNLiquidityAdsListComponent;
  let fixture: ComponentFixture<CLNLiquidityAdsListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNLiquidityAdsListComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNLiquidityAdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Lets NgForm register the inputs (it does so in a microtask) without waiting for the table's timers.
  const enterValue = async (inputName: string, value: string) => {
    await Promise.resolve();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="' + inputName + '"]');
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('should update the opening fees when the channel amount changes without a key press', async () => {
    await enterValue('channelAmount', '200000');
    // base + 200,000 * 50 / 10,000 + (666 / 4) * 10
    expect(component.liquidityNodesData.map((lqNode) => lqNode.channel_opening_fee)).toEqual([22665, 12665]);
  });

  it('should update the opening fees when the fee rate changes without a key press', async () => {
    await enterValue('channel_opening_feeRate', '20');
    // base + 100,000 * 50 / 10,000 + (666 / 4) * 20
    expect(component.liquidityNodesData.map((lqNode) => lqNode.channel_opening_fee)).toEqual([23830, 13830]);
  });
});
