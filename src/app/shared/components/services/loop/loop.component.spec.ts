import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { LoopService } from '../../../../shared/services/loop.service';

import { LoopComponent } from './loop.component';
import { SharedModule } from '../../../shared.module';
import { mockCommonService, mockLoopService } from '../../../services/test-consts';
import { CommonService } from '../../../services/common.service';

describe('LoopComponent', () => {
  let component: LoopComponent;
  let fixture: ComponentFixture<LoopComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopComponent ],
      imports: [
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
        { provide: LoopService, useClass: mockLoopService },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopComponent);
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
