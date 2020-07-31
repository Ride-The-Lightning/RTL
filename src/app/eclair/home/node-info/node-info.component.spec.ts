import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLNodeInfoComponent } from './node-info.component';

describe('ECLNodeInfoComponent', () => {
  let component: ECLNodeInfoComponent;
  let fixture: ComponentFixture<ECLNodeInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLNodeInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLNodeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
