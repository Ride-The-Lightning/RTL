import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRNodeInfoComponent } from './node-info.component';

describe('ECLRNodeInfoComponent', () => {
  let component: ECLRNodeInfoComponent;
  let fixture: ComponentFixture<ECLRNodeInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRNodeInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRNodeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
