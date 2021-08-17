import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeInfoComponent } from './fee-info.component';

describe('FeeInfoComponent', () => {
  let component: FeeInfoComponent;
  let fixture: ComponentFixture<FeeInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FeeInfoComponent]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
