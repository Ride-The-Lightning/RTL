import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRoutingPeersComponent } from './routing-peers.component';

describe('ECLRoutingPeersComponent', () => {
  let component: ECLRoutingPeersComponent;
  let fixture: ComponentFixture<ECLRoutingPeersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRoutingPeersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRoutingPeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
