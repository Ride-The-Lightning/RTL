import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelBackupComponent } from './channel-backup.component';

describe('ChannelBackupComponent', () => {
  let component: ChannelBackupComponent;
  let fixture: ComponentFixture<ChannelBackupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelBackupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelBackupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
