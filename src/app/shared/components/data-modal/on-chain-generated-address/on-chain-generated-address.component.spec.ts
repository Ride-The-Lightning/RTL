import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnChainGeneratedAddressComponent } from './on-chain-generated-address.component';

describe('OnChainGeneratedAddressComponent', () => {
  let component: OnChainGeneratedAddressComponent;
  let fixture: ComponentFixture<OnChainGeneratedAddressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainGeneratedAddressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainGeneratedAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
