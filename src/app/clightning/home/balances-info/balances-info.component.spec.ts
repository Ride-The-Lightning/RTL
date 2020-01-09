import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLBalancesInfoComponent } from './balances-info.component';

describe('CLBalancesInfoComponent', () => {
  let component: CLBalancesInfoComponent;
  let fixture: ComponentFixture<CLBalancesInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLBalancesInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLBalancesInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
