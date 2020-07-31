import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLLookupsComponent } from './lookups.component';

describe('ECLLookupsComponent', () => {
  let component: ECLLookupsComponent;
  let fixture: ComponentFixture<ECLLookupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLLookupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLLookupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
