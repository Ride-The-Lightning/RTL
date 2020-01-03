import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLRoutingComponent } from './routing.component';

describe('CLRoutingComponent', () => {
  let component: CLRoutingComponent;
  let fixture: ComponentFixture<CLRoutingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLRoutingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLRoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
