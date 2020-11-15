import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WithdrawalInfoGraphicsComponent } from './info-graphics.component';

describe('LoopOutInfoGraphicsComponent', () => {
  let component: WithdrawalInfoGraphicsComponent;
  let fixture: ComponentFixture<WithdrawalInfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WithdrawalInfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawalInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
