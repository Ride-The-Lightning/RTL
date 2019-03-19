import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeLookupComponent } from './node-lookup.component';

describe('NodeLookupComponent', () => {
  let component: NodeLookupComponent;
  let fixture: ComponentFixture<NodeLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeLookupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
