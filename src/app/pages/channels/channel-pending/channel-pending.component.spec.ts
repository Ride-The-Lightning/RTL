import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelPendingComponent } from './channel-pending.component';

describe('ChannelPendingComponent', () => {
  let component: ChannelPendingComponent;
  let fixture: ComponentFixture<ChannelPendingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelPendingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelPendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
