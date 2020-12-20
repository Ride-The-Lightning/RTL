import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLConnectionsComponent } from './connections.component';

describe('ECLConnectionsComponent', () => {
  let component: ECLConnectionsComponent;
  let fixture: ComponentFixture<ECLConnectionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLConnectionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLConnectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
