import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLSignComponent } from './sign.component';

describe('CLSignComponent', () => {
  let component: CLSignComponent;
  let fixture: ComponentFixture<CLSignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLSignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLSignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
