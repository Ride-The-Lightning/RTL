import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLHomeComponent } from './home.component';

describe('ECLHomeComponent', () => {
  let component: ECLHomeComponent;
  let fixture: ComponentFixture<ECLHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
