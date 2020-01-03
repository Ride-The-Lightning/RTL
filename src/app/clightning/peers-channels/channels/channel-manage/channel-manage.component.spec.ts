import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelManageComponent } from './channel-manage.component';

describe('CLChannelManageComponent', () => {
  let component: CLChannelManageComponent;
  let fixture: ComponentFixture<CLChannelManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
