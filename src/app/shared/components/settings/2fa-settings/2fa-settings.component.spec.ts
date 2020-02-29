import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoFASettingsComponent } from './2fa-settings.component';

describe('TwoFASettingsComponent', () => {
  let component: TwoFASettingsComponent;
  let fixture: ComponentFixture<TwoFASettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwoFASettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoFASettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
