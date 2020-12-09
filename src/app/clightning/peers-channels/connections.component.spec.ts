import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLConnectionsComponent } from './connections.component';

describe('CLConnectionsComponent', () => {
  let component: CLConnectionsComponent;
  let fixture: ComponentFixture<CLConnectionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLConnectionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLConnectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
