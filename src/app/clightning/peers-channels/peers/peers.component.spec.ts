import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLPeersComponent } from './peers.component';

describe('CLPeersComponent', () => {
  let component: CLPeersComponent;
  let fixture: ComponentFixture<CLPeersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLPeersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLPeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
