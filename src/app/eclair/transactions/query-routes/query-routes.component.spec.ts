import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRQueryRoutesComponent } from './query-routes.component';

describe('ECLRQueryRoutesComponent', () => {
  let component: ECLRQueryRoutesComponent;
  let fixture: ComponentFixture<ECLRQueryRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRQueryRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRQueryRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
