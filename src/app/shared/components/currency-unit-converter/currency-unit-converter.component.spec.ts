import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyUnitConverterComponent } from './currency-unit-converter.component';

describe('CurrencyUnitConverterComponent', () => {
  let component: CurrencyUnitConverterComponent;
  let fixture: ComponentFixture<CurrencyUnitConverterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrencyUnitConverterComponent ]
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
