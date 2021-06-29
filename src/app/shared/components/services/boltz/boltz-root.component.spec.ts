import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { BoltzService } from '../../../services/boltz.service';
import { CommonService } from '../../../services/common.service';
import { mockBoltzService, mockCommonService } from '../../../services/test-consts';
import { SharedModule } from '../../../shared.module';

import { BoltzRootComponent } from './boltz-root.component';

describe('BoltzRootComponent', () => {
  let component: BoltzRootComponent;
  let fixture: ComponentFixture<BoltzRootComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzRootComponent ],
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
        { provide: BoltzService, useClass: mockBoltzService },
        { provide: CommonService, useClass: mockCommonService }        
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzRootComponent);
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
