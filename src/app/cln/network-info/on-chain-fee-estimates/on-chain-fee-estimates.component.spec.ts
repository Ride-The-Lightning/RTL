import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNOnChainFeeEstimatesComponent } from './on-chain-fee-estimates.component';

describe('CLOnChainFeeEstimatesComponent', () => {
  let component: CLOnChainFeeEstimatesComponent;
  let fixture: ComponentFixture<CLOnChainFeeEstimatesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLOnChainFeeEstimatesComponent]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainFeeEstimatesComponent);
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
