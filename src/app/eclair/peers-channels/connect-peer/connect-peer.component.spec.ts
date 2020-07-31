import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLConnectPeerComponent } from './connect-peer.component';

describe('ECLConnectPeerComponent', () => {
  let component: ECLConnectPeerComponent;
  let fixture: ComponentFixture<ECLConnectPeerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLConnectPeerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
