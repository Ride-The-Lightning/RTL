import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLROnChainComponent } from './on-chain.component';

describe('ECLROnChainComponent', () => {
  let component: ECLROnChainComponent;
  let fixture: ComponentFixture<ECLROnChainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLROnChainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLROnChainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
