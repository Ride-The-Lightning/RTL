import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { mockLNDEffects } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

import { RTLReducer } from '../../../store/rtl.reducers';
import { LNDEffects } from '../../store/lnd.effects';
import { InitializeWalletComponent } from './initialize.component';

describe('InitializeWalletComponent', () => {
  let component: InitializeWalletComponent;
  let fixture: ComponentFixture<InitializeWalletComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ InitializeWalletComponent ],
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
        { provide: LNDEffects, useClass: mockLNDEffects }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitializeWalletComponent);
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
