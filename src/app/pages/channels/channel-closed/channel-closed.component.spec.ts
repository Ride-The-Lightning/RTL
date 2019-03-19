import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelClosedComponent } from './channel-closed.component';

describe('ChannelClosedComponent', () => {
  let component: ChannelClosedComponent;
  let fixture: ComponentFixture<ChannelClosedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelClosedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelClosedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
