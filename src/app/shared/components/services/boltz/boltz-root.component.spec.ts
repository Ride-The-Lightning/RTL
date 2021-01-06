import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoltzRootComponent } from './boltz-root.component';

describe('BoltzRootComponent', () => {
  let component: BoltzRootComponent;
  let fixture: ComponentFixture<BoltzRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
