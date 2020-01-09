import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainComponent } from './on-chain.component';

describe('OnChainComponent', () => {
  let component: OnChainComponent;
  let fixture: ComponentFixture<OnChainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
