import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainReceiveComponent } from './on-chain-receive.component';

describe('OnChainReceiveComponent', () => {
  let component: OnChainReceiveComponent;
  let fixture: ComponentFixture<OnChainReceiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainReceiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
