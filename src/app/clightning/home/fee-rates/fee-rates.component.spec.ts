import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeRatesComponent } from './fee-rates.component';

describe('FeeRatesComponent', () => {
  let component: FeeRatesComponent;
  let fixture: ComponentFixture<FeeRatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeeRatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeeRatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
