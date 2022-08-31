import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';

import { CLNSwapInModalComponent } from './swap-in-modal.component';

describe('CLNSwapInModalComponent', () => {
  let component: CLNSwapInModalComponent;
  let fixture: ComponentFixture<CLNSwapInModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNSwapInModalComponent],
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
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
            swapPeer: {
              nodeid: '02c9fc0cc737abcff2b502076c43f123451e542e96a79ae177059f3bb796add784',
              swaps_allowed: true,
              supported_assets: [
                'btc'
              ],
              channels: [
                {
                  short_channel_id: '104239x1x1',
                  local_balance: 9589761,
                  remote_balance: 410239,
                  local_percentage: 0.9589761,
                  state: 'CHANNELD_NORMAL'
                },
                {
                  short_channel_id: '104770x6x1',
                  local_balance: 200000,
                  remote_balance: 0,
                  local_percentage: 1,
                  state: 'CHANNELD_NORMAL'
                }
              ],
              sent: {
                total_swaps_out: 2,
                total_swaps_in: 2,
                total_sats_swapped_out: 1110154,
                total_sats_swapped_in: 600154
              },
              received: {
                total_swaps_out: 1,
                total_swaps_in: 0,
                total_sats_swapped_out: 100000,
                total_sats_swapped_in: 0
              },
              total_fee_paid: 478,
              alias: 'nodeSignet',
              short_channel_id: '104239x1x1',
              local_balance: 9589761,
              remote_balance: 410239,
              local_percentage: 0.9589761,
              state: 'CHANNELD_NORMAL'
            }
          }
        }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNSwapInModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
