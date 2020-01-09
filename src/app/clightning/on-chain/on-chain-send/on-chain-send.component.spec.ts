import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOnChainSendComponent } from './on-chain-send.component';

describe('CLOnChainSendComponent', () => {
  let component: CLOnChainSendComponent;
  let fixture: ComponentFixture<CLOnChainSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
