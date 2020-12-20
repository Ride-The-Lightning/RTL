import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontalScrollerComponent } from './horizontal-scroller.component';
import { CommonService } from '../../services/common.service';
import { Store, StoreModule } from '@ngrx/store';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { RTLReducer } from '../../../store/rtl.reducers';

describe('HorizontalScrollerComponent', () => {
  let component: HorizontalScrollerComponent;
  let fixture: ComponentFixture<HorizontalScrollerComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService",["getScreenSize","setScreenSize",
"sortDescByKey","camelCase","titleCase","convertCurrency","convertWithoutFiat","convertWithFiat",
"convertTime","convertTimestampToDate","downloadFile","convertToCSV"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HorizontalScrollerComponent ],
      providers: [
        { provide: CommonService, useValue: mockCommonService }
      ],
      imports:[
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
    fixture = TestBed.createComponent(HorizontalScrollerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
