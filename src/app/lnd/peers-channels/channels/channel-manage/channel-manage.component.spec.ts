import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelManageComponent } from './channel-manage.component';

describe('ChannelManageComponent', () => {
  let component: ChannelManageComponent;
  let fixture: ComponentFixture<ChannelManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
