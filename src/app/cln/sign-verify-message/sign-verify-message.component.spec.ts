import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';

import { CLNSignVerifyMessageComponent } from './sign-verify-message.component';

describe('CLNSignVerifyMessageComponent', () => {
  let component: CLNSignVerifyMessageComponent;
  let fixture: ComponentFixture<CLNSignVerifyMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNSignVerifyMessageComponent],
      imports: [SharedModule, RouterTestingModule]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNSignVerifyMessageComponent);
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
