import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNFeeRatesComponent } from './fee-rates.component';

describe('CLNFeeRatesComponent', () => {
  let component: CLNFeeRatesComponent;
  let fixture: ComponentFixture<CLNFeeRatesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNFeeRatesComponent]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNFeeRatesComponent);
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
