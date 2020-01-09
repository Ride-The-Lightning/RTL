import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLFeeInfoComponent } from './fee-info.component';

describe('CLFeeInfoComponent', () => {
  let component: CLFeeInfoComponent;
  let fixture: ComponentFixture<CLFeeInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLFeeInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLFeeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
