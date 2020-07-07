import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelPendingTableComponent } from './channel-pending-table.component';

describe('ECLChannelPendingTableComponent', () => {
  let component: ECLChannelPendingTableComponent;
  let fixture: ComponentFixture<ECLChannelPendingTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelPendingTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelPendingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
