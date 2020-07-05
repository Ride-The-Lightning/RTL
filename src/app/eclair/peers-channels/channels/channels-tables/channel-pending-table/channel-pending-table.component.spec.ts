import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelPendingTableComponent } from './channel-pending-table.component';

describe('ECLRChannelPendingTableComponent', () => {
  let component: ECLRChannelPendingTableComponent;
  let fixture: ComponentFixture<ECLRChannelPendingTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelPendingTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelPendingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
