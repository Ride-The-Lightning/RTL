import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

describe('ChannelLiquidityInfoComponent', () => {
  let component: ChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<ChannelLiquidityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelLiquidityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
