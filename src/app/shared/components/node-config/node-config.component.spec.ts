import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeConfigComponent } from './node-config.component';

describe('NodeConfigComponent', () => {
  let component: NodeConfigComponent;
  let fixture: ComponentFixture<NodeConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
