import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignVerifyMessageComponent } from './sign-verify-message.component';

describe('SignVerifyMessageComponent', () => {
  let component: SignVerifyMessageComponent;
  let fixture: ComponentFixture<SignVerifyMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignVerifyMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignVerifyMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
