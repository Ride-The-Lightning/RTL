import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOnChainUtxosComponent } from './utxos.component';

describe('CLOnChainUtxosComponent', () => {
  let component: CLOnChainUtxosComponent;
  let fixture: ComponentFixture<CLOnChainUtxosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOnChainUtxosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOnChainUtxosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
