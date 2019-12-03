import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BalancesInfoComponent } from './balances-info.component';

describe('BalancesInfoComponent', () => {
  let component: BalancesInfoComponent;
  let fixture: ComponentFixture<BalancesInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BalancesInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BalancesInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
