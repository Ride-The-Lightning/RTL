import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';

import { SwapsComponent } from './swaps.component';
import { mockCommonService, mockLoopService } from '../../../../services/test-consts';
import { SharedModule } from '../../../../shared.module';

describe('SwapsComponent', () => {
  let component: SwapsComponent;
  let fixture: ComponentFixture<SwapsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapsComponent ],
      imports: [
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
        { provide: LoopService, useClass: mockLoopService },
        { provide: CommonService, useClass: mockCommonService }        
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapsComponent);
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
