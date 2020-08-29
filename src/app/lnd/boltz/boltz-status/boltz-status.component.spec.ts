import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoltzStatusComponent } from './boltz-status.component';

describe('BoltzStatusComponent', () => {
  let component: BoltzStatusComponent;
  let fixture: ComponentFixture<BoltzStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
