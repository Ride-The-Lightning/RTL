import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLSignVerifyMessageComponent } from './sign-verify-message.component';

describe('CLSignVerifyMessageComponent', () => {
  let component: CLSignVerifyMessageComponent;
  let fixture: ComponentFixture<CLSignVerifyMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLSignVerifyMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLSignVerifyMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
