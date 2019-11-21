import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelBackupTableComponent } from './channel-backup-table.component';

describe('ChannelBackupTableComponent', () => {
  let component: ChannelBackupTableComponent;
  let fixture: ComponentFixture<ChannelBackupTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelBackupTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelBackupTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
