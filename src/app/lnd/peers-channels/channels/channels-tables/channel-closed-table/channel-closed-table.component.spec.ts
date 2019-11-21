import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelClosedTableComponent } from './channel-closed-table.component';

describe('ChannelClosedTableComponent', () => {
  let component: ChannelClosedTableComponent;
  let fixture: ComponentFixture<ChannelClosedTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelClosedTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelClosedTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
