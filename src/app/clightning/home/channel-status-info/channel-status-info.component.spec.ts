import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelStatusInfoComponent } from './channel-status-info.component';

describe('CLChannelStatusInfoComponent', () => {
  let component: CLChannelStatusInfoComponent;
  let fixture: ComponentFixture<CLChannelStatusInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelStatusInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelStatusInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
