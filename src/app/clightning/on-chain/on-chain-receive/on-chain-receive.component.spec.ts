import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOnChainReceiveComponent } from './on-chain-receive.component';

describe('CLOnChainReceiveComponent', () => {
  let component: CLOnChainReceiveComponent;
  let fixture: ComponentFixture<CLOnChainReceiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainReceiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
