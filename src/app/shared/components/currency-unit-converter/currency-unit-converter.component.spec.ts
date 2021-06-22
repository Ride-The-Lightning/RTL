import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { CurrencyUnitConverterComponent } from './currency-unit-converter.component';

describe('CurrencyUnitConverterComponent', () => {
  let component: CurrencyUnitConverterComponent;
  let fixture: ComponentFixture<CurrencyUnitConverterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrencyUnitConverterComponent ],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
 ],
      providers: [ CommonService ]
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
