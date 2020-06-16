import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

describe('ECLRChannelLiquidityInfoComponent', () => {
  let component: ECLRChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<ECLRChannelLiquidityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelLiquidityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
