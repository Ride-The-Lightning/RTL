import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOnChainComponent } from './on-chain.component';

describe('CLOnChainComponent', () => {
  let component: CLOnChainComponent;
  let fixture: ComponentFixture<CLOnChainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
