import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLROnChainSendComponent } from './on-chain-send.component';

describe('ECLROnChainSendComponent', () => {
  let component: ECLROnChainSendComponent;
  let fixture: ComponentFixture<ECLROnChainSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLROnChainSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLROnChainSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
