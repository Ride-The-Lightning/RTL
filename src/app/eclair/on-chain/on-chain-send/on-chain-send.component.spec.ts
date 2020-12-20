import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLOnChainSendComponent } from './on-chain-send.component';

describe('ECLOnChainSendComponent', () => {
  let component: ECLOnChainSendComponent;
  let fixture: ComponentFixture<ECLOnChainSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLOnChainSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
