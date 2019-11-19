import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainSendComponent } from './on-chain-send.component';

describe('OnChainSendComponent', () => {
  let component: OnChainSendComponent;
  let fixture: ComponentFixture<OnChainSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
