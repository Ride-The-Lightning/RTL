import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectPeerComponent } from './connect-peer.component';

describe('ConnectPeerComponent', () => {
  let component: ConnectPeerComponent;
  let fixture: ComponentFixture<ConnectPeerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectPeerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
