import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRBalancesInfoComponent } from './balances-info.component';

describe('ECLRBalancesInfoComponent', () => {
  let component: ECLRBalancesInfoComponent;
  let fixture: ComponentFixture<ECLRBalancesInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRBalancesInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRBalancesInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
