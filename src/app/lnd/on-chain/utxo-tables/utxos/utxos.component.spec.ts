import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainUTXOsComponent } from './utxos.component';

describe('OnChainUTXOsComponent', () => {
  let component: OnChainUTXOsComponent;
  let fixture: ComponentFixture<OnChainUTXOsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainUTXOsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainUTXOsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
