import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeSettingsComponent } from './node-settings.component';

describe('NodeSettingsComponent', () => {
  let component: NodeSettingsComponent;
  let fixture: ComponentFixture<NodeSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
