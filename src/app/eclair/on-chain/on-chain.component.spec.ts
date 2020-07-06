import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLOnChainComponent } from './on-chain.component';

describe('ECLOnChainComponent', () => {
  let component: ECLOnChainComponent;
  let fixture: ComponentFixture<ECLOnChainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLOnChainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
