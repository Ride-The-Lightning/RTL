import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRRoutingComponent } from './routing.component';

describe('ECLRRoutingComponent', () => {
  let component: ECLRRoutingComponent;
  let fixture: ComponentFixture<ECLRRoutingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRRoutingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRRoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
