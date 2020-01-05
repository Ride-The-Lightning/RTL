import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelPendingTableComponent } from './channel-pending-table.component';

describe('CLChannelPendingTableComponent', () => {
  let component: CLChannelPendingTableComponent;
  let fixture: ComponentFixture<CLChannelPendingTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelPendingTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelPendingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
