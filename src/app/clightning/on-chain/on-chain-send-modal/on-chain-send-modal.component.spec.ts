import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOnChainSendModalComponent } from './on-chain-send-modal.component';

describe('CLOnChainSendModalComponent', () => {
  let component: CLOnChainSendModalComponent;
  let fixture: ComponentFixture<CLOnChainSendModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainSendModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainSendModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
