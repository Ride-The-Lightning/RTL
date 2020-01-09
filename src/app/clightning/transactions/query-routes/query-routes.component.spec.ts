import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLQueryRoutesComponent } from './query-routes.component';

describe('CLQueryRoutesComponent', () => {
  let component: CLQueryRoutesComponent;
  let fixture: ComponentFixture<CLQueryRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLQueryRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLQueryRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
