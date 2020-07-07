import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLFeeInfoComponent } from './fee-info.component';

describe('ECLFeeInfoComponent', () => {
  let component: ECLFeeInfoComponent;
  let fixture: ComponentFixture<ECLFeeInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLFeeInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLFeeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
