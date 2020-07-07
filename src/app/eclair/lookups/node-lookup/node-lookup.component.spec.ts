import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLNodeLookupComponent } from './node-lookup.component';

describe('ECLNodeLookupComponent', () => {
  let component: ECLNodeLookupComponent;
  let fixture: ComponentFixture<ECLNodeLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLNodeLookupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLNodeLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
