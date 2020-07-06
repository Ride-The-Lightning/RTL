import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLOnChainReceiveComponent } from './on-chain-receive.component';

describe('ECLOnChainReceiveComponent', () => {
  let component: ECLOnChainReceiveComponent;
  let fixture: ComponentFixture<ECLOnChainReceiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLOnChainReceiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
