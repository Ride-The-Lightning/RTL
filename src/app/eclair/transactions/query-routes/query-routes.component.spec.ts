import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLQueryRoutesComponent } from './query-routes.component';

describe('ECLQueryRoutesComponent', () => {
  let component: ECLQueryRoutesComponent;
  let fixture: ComponentFixture<ECLQueryRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLQueryRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLQueryRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
