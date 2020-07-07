import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

describe('ECLChannelLiquidityInfoComponent', () => {
  let component: ECLChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<ECLChannelLiquidityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelLiquidityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
