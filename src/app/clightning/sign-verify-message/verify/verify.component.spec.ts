import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLVerifyComponent } from './verify.component';

describe('CLVerifyComponent', () => {
  let component: CLVerifyComponent;
  let fixture: ComponentFixture<CLVerifyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLVerifyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
