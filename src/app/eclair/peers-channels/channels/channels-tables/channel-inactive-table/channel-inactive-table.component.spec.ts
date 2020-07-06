import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelInactiveTableComponent } from './channel-inactive-table.component';

describe('ECLChannelInactiveTableComponent', () => {
  let component: ECLChannelInactiveTableComponent;
  let fixture: ComponentFixture<ECLChannelInactiveTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelInactiveTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelInactiveTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
