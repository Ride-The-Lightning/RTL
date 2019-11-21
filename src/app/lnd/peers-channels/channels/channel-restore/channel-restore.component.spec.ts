import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelRestoreComponent } from './channel-restore.component';

describe('ChannelRestoreComponent', () => {
  let component: ChannelRestoreComponent;
  let fixture: ComponentFixture<ChannelRestoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelRestoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelRestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
