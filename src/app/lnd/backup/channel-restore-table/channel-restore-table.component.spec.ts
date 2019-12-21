import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelRestoreTableComponent } from './channel-restore-table.component';

describe('ChannelRestoreTableComponent', () => {
  let component: ChannelRestoreTableComponent;
  let fixture: ComponentFixture<ChannelRestoreTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelRestoreTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelRestoreTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
