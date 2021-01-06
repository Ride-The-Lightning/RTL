import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapStatusComponent } from './swap-status.component';

describe('SwapStatusComponent', () => {
  let component: SwapStatusComponent;
  let fixture: ComponentFixture<SwapStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
