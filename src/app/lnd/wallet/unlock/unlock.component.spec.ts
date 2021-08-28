import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../../../shared/shared.module';

import { RTLReducer } from '../../../store/rtl.reducers';
import { UnlockWalletComponent } from './unlock.component';

describe('UnlockWalletComponent', () => {
  let component: UnlockWalletComponent;
  let fixture: ComponentFixture<UnlockWalletComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UnlockWalletComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnlockWalletComponent);
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
