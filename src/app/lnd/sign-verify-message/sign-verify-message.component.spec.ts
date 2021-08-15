import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';

import { SignVerifyMessageComponent } from './sign-verify-message.component';

describe('SignVerifyMessageComponent', () => {
  let component: SignVerifyMessageComponent;
  let fixture: ComponentFixture<SignVerifyMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SignVerifyMessageComponent],
      imports: [SharedModule, RouterTestingModule]
    }).
    compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignVerifyMessageComponent);
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
