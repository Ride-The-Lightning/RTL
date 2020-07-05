import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelInactiveTableComponent } from './channel-inactive-table.component';

describe('ECLRChannelInactiveTableComponent', () => {
  let component: ECLRChannelInactiveTableComponent;
  let fixture: ComponentFixture<ECLRChannelInactiveTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelInactiveTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelInactiveTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
