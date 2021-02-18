import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupNodeComponent } from './setup-node.component';

describe('SetupNodeComponent', () => {
  let component: SetupNodeComponent;
  let fixture: ComponentFixture<SetupNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
