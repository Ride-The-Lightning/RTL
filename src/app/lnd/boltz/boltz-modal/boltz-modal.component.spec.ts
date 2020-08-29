import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoltzModalComponent } from './boltz-modal.component';

describe('BoltzModalComponent', () => {
  let component: BoltzModalComponent;
  let fixture: ComponentFixture<BoltzModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoltzModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoltzModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
