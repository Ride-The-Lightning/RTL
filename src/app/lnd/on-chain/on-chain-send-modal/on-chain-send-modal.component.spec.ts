import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainSendModalComponent } from './on-chain-send-modal.component';

describe('OnChainSendModalComponent', () => {
  let component: OnChainSendModalComponent;
  let fixture: ComponentFixture<OnChainSendModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainSendModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainSendModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
