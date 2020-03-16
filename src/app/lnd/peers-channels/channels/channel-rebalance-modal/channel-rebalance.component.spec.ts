import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelRebalanceComponent } from './channel-rebalance.component';

describe('ChannelRebalanceComponent', () => {
  let component: ChannelRebalanceComponent;
  let fixture: ComponentFixture<ChannelRebalanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelRebalanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelRebalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
