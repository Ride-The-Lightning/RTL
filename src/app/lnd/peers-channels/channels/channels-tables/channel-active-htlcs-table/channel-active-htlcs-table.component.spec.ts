import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelActiveHTLCsTableComponent } from './channel-active-htlcs-table.component';

describe('ChannelActiveHTLCsTableComponent', () => {
  let component: ChannelActiveHTLCsTableComponent;
  let fixture: ComponentFixture<ChannelActiveHTLCsTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelActiveHTLCsTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelActiveHTLCsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
