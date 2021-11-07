import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../../clightning/store/cl.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { BoltzService } from '../../../services/boltz.service';
import { CommonService } from '../../../services/common.service';
import { DataService } from '../../../services/data.service';
import { mockBoltzService, mockDataService } from '../../../test-helpers/mock-services';
import { SharedModule } from '../../../shared.module';

import { BoltzRootComponent } from './boltz-root.component';

describe('BoltzRootComponent', () => {
  let component: BoltzRootComponent;
  let fixture: ComponentFixture<BoltzRootComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BoltzRootComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: BoltzService, useClass: mockBoltzService }
      ]
    }).
      compileComponents();
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
