import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../../../shared/shared.module';

import { RTLReducer } from '../../../store/rtl.reducers';
import { OnChainSendComponent } from './on-chain-send.component';

describe('OnChainSendComponent', () => {
  let component: OnChainSendComponent;
  let fixture: ComponentFixture<OnChainSendComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnChainSendComponent],
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainSendComponent);
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
