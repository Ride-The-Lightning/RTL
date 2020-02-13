import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseChannelLndComponent } from './close-channel-lnd.component';

describe('CloseChannelLndComponent', () => {
  let component: CloseChannelLndComponent;
  let fixture: ComponentFixture<CloseChannelLndComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseChannelLndComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseChannelLndComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
