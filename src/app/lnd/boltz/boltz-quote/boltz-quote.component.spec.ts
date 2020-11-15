import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoltzQuoteComponent } from './boltz-quote.component';

describe('LoopQuoteComponent', () => {
  let component: BoltzQuoteComponent;
  let fixture: ComponentFixture<BoltzQuoteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzQuoteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzQuoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
