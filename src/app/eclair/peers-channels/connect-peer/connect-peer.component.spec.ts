import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRConnectPeerComponent } from './connect-peer.component';

describe('ECLRConnectPeerComponent', () => {
  let component: ECLRConnectPeerComponent;
  let fixture: ComponentFixture<ECLRConnectPeerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRConnectPeerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
