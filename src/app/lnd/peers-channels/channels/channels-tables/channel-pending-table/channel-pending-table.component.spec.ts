import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelPendingTableComponent } from './channel-pending-table.component';

describe('ChannelPendingTableComponent', () => {
  let component: ChannelPendingTableComponent;
  let fixture: ComponentFixture<ChannelPendingTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelPendingTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelPendingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
