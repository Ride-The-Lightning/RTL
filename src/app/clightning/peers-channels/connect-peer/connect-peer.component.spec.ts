import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLConnectPeerComponent } from './connect-peer.component';

describe('CLConnectPeerComponent', () => {
  let component: CLConnectPeerComponent;
  let fixture: ComponentFixture<CLConnectPeerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLConnectPeerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
