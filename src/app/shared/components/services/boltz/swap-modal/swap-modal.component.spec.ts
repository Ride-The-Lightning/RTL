import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { BoltzService } from '../../../../../shared/services/boltz.service';

import { SwapModalComponent } from './swap-modal.component';
import { SharedModule } from '../../../../shared.module';
import { mockBoltzService, mockCommonService, mockMatDialogRef } from '../../../../services/test-consts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('SwapModalComponent', () => {
  let component: SwapModalComponent;
  let fixture: ComponentFixture<SwapModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapModalComponent ],
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
        LoggerService,
        { provide: BoltzService, useClass: mockBoltzService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {channel: {}, serviceInfo: { fees: {percentage: 2, miner: {normal: 2, reverse: 2}}, limits: {minimal: 10000, maximal: 50000000}}, direction: 'SWAP_IN'}},
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapModalComponent);
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
