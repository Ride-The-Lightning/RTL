import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryRoutesComponent } from './query-routes.component';

describe('QueryRoutesComponent', () => {
  let component: QueryRoutesComponent;
  let fixture: ComponentFixture<QueryRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueryRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
