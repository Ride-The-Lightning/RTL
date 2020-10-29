import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BumpFeeComponent } from './bump-fee.component';

describe('BumpFeeComponent', () => {
  let component: BumpFeeComponent;
  let fixture: ComponentFixture<BumpFeeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BumpFeeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BumpFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
