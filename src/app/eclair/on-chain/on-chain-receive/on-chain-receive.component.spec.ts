import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLROnChainReceiveComponent } from './on-chain-receive.component';

describe('ECLROnChainReceiveComponent', () => {
  let component: ECLROnChainReceiveComponent;
  let fixture: ComponentFixture<ECLROnChainReceiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLROnChainReceiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLROnChainReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
