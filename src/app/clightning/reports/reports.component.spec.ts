import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLReportsComponent } from './reports.component';

describe('CLReportsComponent', () => {
  let component: CLReportsComponent;
  let fixture: ComponentFixture<CLReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
