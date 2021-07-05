import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';

import { CLSignVerifyMessageComponent } from './sign-verify-message.component';

describe('CLSignVerifyMessageComponent', () => {
  let component: CLSignVerifyMessageComponent;
  let fixture: ComponentFixture<CLSignVerifyMessageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLSignVerifyMessageComponent ],
      imports: [ SharedModule, RouterTestingModule ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(CLSignVerifyMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
