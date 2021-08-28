import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { mockECLEffects } from '../../../shared/test-helpers/mock-services';

import { RTLReducer } from '../../../store/rtl.reducers';
import { ECLEffects } from '../../store/ecl.effects';
import { ECLOnChainReceiveComponent } from './on-chain-receive.component';

describe('ECLOnChainReceiveComponent', () => {
  let component: ECLOnChainReceiveComponent;
  let fixture: ComponentFixture<ECLOnChainReceiveComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLOnChainReceiveComponent],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        { provide: ECLEffects, useClass: mockECLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainReceiveComponent);
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
