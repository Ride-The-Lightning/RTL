import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { mockDataService, mockLNDEffects } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { LNDEffects } from '../../store/lnd.effects';
import { OnChainReceiveComponent } from './on-chain-receive.component';

describe('OnChainReceiveComponent', () => {
  let component: OnChainReceiveComponent;
  let fixture: ComponentFixture<OnChainReceiveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnChainReceiveComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: LNDEffects, useClass: mockLNDEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainReceiveComponent);
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
