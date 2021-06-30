import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { BoltzService } from '../../../../../shared/services/boltz.service';

import { BoltzSwapsComponent } from './swaps.component';
import { mockBoltzService, mockCommonService } from '../../../../services/test-consts';
import { SharedModule } from '../../../../shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('BoltzSwapsComponent', () => {
  let component: BoltzSwapsComponent;
  let fixture: ComponentFixture<BoltzSwapsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzSwapsComponent ],
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
        LoggerService,
        { provide: BoltzService, useClass: mockBoltzService },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzSwapsComponent);
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
