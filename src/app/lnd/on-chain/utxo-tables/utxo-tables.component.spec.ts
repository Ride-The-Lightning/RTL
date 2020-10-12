import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UTXOTablesComponent } from './utxo-tables.component';

describe('UTXOTablesComponent', () => {
  let component: UTXOTablesComponent;
  let fixture: ComponentFixture<UTXOTablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UTXOTablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UTXOTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
