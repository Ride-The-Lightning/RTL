import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CLBumpFeeComponent } from './bump-fee.component';

describe('CLBumpFeeComponent', () => {
  let component: CLBumpFeeComponent;
  let fixture: ComponentFixture<CLBumpFeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CLBumpFeeComponent]
    }).
      compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CLBumpFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
