import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapQuoteComponent } from './swap-quote.component';

describe('SwapQuoteComponent', () => {
  let component: SwapQuoteComponent;
  let fixture: ComponentFixture<SwapQuoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapQuoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
