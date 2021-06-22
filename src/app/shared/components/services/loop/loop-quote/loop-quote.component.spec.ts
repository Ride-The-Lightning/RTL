import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopQuoteComponent } from './loop-quote.component';

describe('LoopQuoteComponent', () => {
  let component: LoopQuoteComponent;
  let fixture: ComponentFixture<LoopQuoteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopQuoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
