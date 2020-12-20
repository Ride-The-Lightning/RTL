import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLReportsComponent } from './reports.component';

describe('ECLReportsComponent', () => {
  let component: ECLReportsComponent;
  let fixture: ComponentFixture<ECLReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
