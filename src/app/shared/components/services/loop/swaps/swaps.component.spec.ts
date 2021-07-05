import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';

import { SwapsComponent } from './swaps.component';
import { mockDataService, mockLoopService } from '../../../../test-helpers/test-consts';
import { SharedModule } from '../../../../shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../services/data.service';

describe('SwapsComponent', () => {
  let component: SwapsComponent;
  let fixture: ComponentFixture<SwapsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapsComponent ],
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
        { provide: LoopService, useClass: mockLoopService }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(SwapsComponent);
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
