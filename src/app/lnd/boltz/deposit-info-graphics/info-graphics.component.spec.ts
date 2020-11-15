import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositInfoGraphicsComponent } from './info-graphics.component';

describe('LoopInInfoGraphicsComponent', () => {
  let component: DepositInfoGraphicsComponent;
  let fixture: ComponentFixture<DepositInfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepositInfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
