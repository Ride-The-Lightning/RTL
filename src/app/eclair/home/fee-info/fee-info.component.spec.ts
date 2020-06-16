import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRFeeInfoComponent } from './fee-info.component';

describe('ECLRFeeInfoComponent', () => {
  let component: ECLRFeeInfoComponent;
  let fixture: ComponentFixture<ECLRFeeInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRFeeInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRFeeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
