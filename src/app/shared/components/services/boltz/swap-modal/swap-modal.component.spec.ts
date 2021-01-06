import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapModalComponent } from './swap-modal.component';

describe('SwapModalComponent', () => {
  let component: SwapModalComponent;
  let fixture: ComponentFixture<SwapModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
