import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLPeersComponent } from './peers.component';

describe('ECLPeersComponent', () => {
  let component: ECLPeersComponent;
  let fixture: ComponentFixture<ECLPeersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLPeersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLPeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
