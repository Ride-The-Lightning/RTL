import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoltzComponent } from './boltz.component';

describe('BoltzComponent', () => {
  let component: BoltzComponent;
  let fixture: ComponentFixture<BoltzComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
