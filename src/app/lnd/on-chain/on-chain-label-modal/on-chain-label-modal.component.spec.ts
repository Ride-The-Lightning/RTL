import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainLabelModalComponent } from './on-chain-label-modal.component';

describe('OnChainLabelModalComponent', () => {
  let component: OnChainLabelModalComponent;
  let fixture: ComponentFixture<OnChainLabelModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainLabelModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainLabelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
