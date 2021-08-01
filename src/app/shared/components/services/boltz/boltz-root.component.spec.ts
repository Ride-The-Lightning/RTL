import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { BoltzService } from '../../../services/boltz.service';
import { CommonService } from '../../../services/common.service';
import { DataService } from '../../../services/data.service';
import { mockBoltzService, mockDataService, mockLoggerService } from '../../../test-helpers/mock-services';
import { SharedModule } from '../../../shared.module';

import { BoltzRootComponent } from './boltz-root.component';

describe('BoltzRootComponent', () => {
  let component: BoltzRootComponent;
  let fixture: ComponentFixture<BoltzRootComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzRootComponent ],
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
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: BoltzService, useClass: mockBoltzService }
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
