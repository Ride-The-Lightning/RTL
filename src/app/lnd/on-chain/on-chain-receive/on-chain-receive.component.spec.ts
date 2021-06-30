import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { mockLNDEffects } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';

import { RTLReducer } from '../../../store/rtl.reducers';
import { LNDEffects } from '../../store/lnd.effects';
import { OnChainReceiveComponent } from './on-chain-receive.component';

describe('OnChainReceiveComponent', () => {
  let component: OnChainReceiveComponent;
  let fixture: ComponentFixture<OnChainReceiveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainReceiveComponent ],
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
        { provide: LNDEffects, useClass: mockLNDEffects }
      ]
    })
    .compileComponents();
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
