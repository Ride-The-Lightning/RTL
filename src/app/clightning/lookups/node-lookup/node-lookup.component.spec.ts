import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNodeLookupComponent } from './node-lookup.component';

describe('CLNodeLookupComponent', () => {
  let component: CLNodeLookupComponent;
  let fixture: ComponentFixture<CLNodeLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLNodeLookupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNodeLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
