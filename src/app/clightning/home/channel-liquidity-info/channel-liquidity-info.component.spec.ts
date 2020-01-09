import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

describe('CLChannelLiquidityInfoComponent', () => {
  let component: CLChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<CLChannelLiquidityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelLiquidityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
