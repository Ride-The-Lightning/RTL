import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRoutingComponent } from './routing.component';

describe('ECLRoutingComponent', () => {
  let component: ECLRoutingComponent;
  let fixture: ComponentFixture<ECLRoutingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRoutingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
