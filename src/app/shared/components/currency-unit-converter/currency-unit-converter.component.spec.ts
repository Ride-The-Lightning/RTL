import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyUnitConverterComponent } from './currency-unit-converter.component';
import { CommonService } from '../../services/common.service';
import { Store, StoreModule } from '@ngrx/store';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { RTLReducer } from '../../../store/rtl.reducers';

describe('CurrencyUnitConverterComponent', () => {
  let component: CurrencyUnitConverterComponent;
  let fixture: ComponentFixture<CurrencyUnitConverterComponent>;
  const mockCommonService = jasmine.createSpyObj("CommonService",["getScreenSize","setScreenSize",
"sortDescByKey","camelCase","titleCase","convertCurrency","convertWithoutFiat","convertWithFiat",
"convertTime","convertTimestampToDate","downloadFile","convertToCSV"]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrencyUnitConverterComponent ],
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
    fixture = TestBed.createComponent(CurrencyUnitConverterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
