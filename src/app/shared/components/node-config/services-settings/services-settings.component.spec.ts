import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesSettingsComponent } from './services-settings.component';

describe('ServicesSettingsComponent', () => {
  let component: ServicesSettingsComponent;
  let fixture: ComponentFixture<ServicesSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServicesSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
