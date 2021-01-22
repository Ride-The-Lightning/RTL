import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLUTXOTablesComponent } from './utxo-tables.component';

describe('CLUTXOTablesComponent', () => {
  let component: CLUTXOTablesComponent;
  let fixture: ComponentFixture<CLUTXOTablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLUTXOTablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLUTXOTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
