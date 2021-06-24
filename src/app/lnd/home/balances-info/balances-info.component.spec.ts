import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { BalancesInfoComponent } from './balances-info.component';

describe('BalancesInfoComponent', () => {
  let component: BalancesInfoComponent;
  let fixture: ComponentFixture<BalancesInfoComponent>;

  beforeEach(waitForAsync(() => {
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

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
