import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNOnChainFeeEstimatesComponent } from './on-chain-fee-estimates.component';

describe('CLNOnChainFeeEstimatesComponent', () => {
  let component: CLNOnChainFeeEstimatesComponent;
  let fixture: ComponentFixture<CLNOnChainFeeEstimatesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNOnChainFeeEstimatesComponent]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNOnChainFeeEstimatesComponent);
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
