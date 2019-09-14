import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLPaymentsComponent } from './payments.component';

describe('CLPaymentsComponent', () => {
  let component: CLPaymentsComponent;
  let fixture: ComponentFixture<CLPaymentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLPaymentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
