import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLLookupsComponent } from './lookups.component';

describe('CLLookupsComponent', () => {
  let component: CLLookupsComponent;
  let fixture: ComponentFixture<CLLookupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLLookupsComponent ],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
, provideMockActions ],
      providers: [ LoggerService, CommonService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLLookupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
