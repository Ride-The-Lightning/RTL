import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLFeeRatesComponent } from './fee-rates.component';

describe('CLFeeRatesComponent', () => {
  let component: CLFeeRatesComponent;
  let fixture: ComponentFixture<CLFeeRatesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLFeeRatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLFeeRatesComponent);
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
