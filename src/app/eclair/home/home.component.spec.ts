import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRHomeComponent } from './home.component';

describe('ECLRHomeComponent', () => {
  let component: ECLRHomeComponent;
  let fixture: ComponentFixture<ECLRHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
