import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutingPeersComponent } from './routing-peers.component';

describe('RoutingPeersComponent', () => {
  let component: RoutingPeersComponent;
  let fixture: ComponentFixture<RoutingPeersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoutingPeersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutingPeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
