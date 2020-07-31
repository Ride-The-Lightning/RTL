import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLBalancesInfoComponent } from './balances-info.component';

describe('ECLBalancesInfoComponent', () => {
  let component: ECLBalancesInfoComponent;
  let fixture: ComponentFixture<ECLBalancesInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLBalancesInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLBalancesInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
