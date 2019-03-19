import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsNavComponent } from './settings-nav.component';

describe('SettingsNavComponent', () => {
  let component: SettingsNavComponent;
  let fixture: ComponentFixture<SettingsNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingsNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
