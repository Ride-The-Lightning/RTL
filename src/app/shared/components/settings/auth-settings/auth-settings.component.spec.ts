import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthSettingsComponent } from './auth-settings.component';

describe('AuthSettingsComponent', () => {
  let component: AuthSettingsComponent;
  let fixture: ComponentFixture<AuthSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
