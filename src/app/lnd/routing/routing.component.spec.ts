import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../../shared/shared.module';

import { RTLReducer } from '../../store/rtl.reducers';
import { RoutingComponent } from './routing.component';

describe('RoutingComponent', () => {
  let component: RoutingComponent;
  let fixture: ComponentFixture<RoutingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RoutingComponent],
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
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutingComponent);
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
