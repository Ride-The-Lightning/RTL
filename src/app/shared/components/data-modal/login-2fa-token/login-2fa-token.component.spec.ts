import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTokenComponent } from './login-2fa-token.component';

describe('LoginTokenComponent', () => {
  let component: LoginTokenComponent;
  let fixture: ComponentFixture<LoginTokenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginTokenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
