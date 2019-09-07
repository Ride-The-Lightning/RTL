import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLLookupsComponent } from './lookups.component';

describe('CLLookupsComponent', () => {
  let component: CLLookupsComponent;
  let fixture: ComponentFixture<CLLookupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLLookupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLLookupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
