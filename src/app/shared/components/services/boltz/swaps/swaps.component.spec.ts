import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoltzSwapsComponent } from './swaps.component';

describe('BoltzSwapsComponent', () => {
  let component: BoltzSwapsComponent;
  let fixture: ComponentFixture<BoltzSwapsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzSwapsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzSwapsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
