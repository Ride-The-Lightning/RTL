import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectPeerModalComponent } from './connect-peer-modal.component';

describe('ConnectPeerModalComponent', () => {
  let component: ConnectPeerModalComponent;
  let fixture: ComponentFixture<ConnectPeerModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectPeerModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectPeerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
