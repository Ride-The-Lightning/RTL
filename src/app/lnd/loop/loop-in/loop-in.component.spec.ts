import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopInComponent } from './loop-in.component';

describe('LoopInComponent', () => {
  let component: LoopInComponent;
  let fixture: ComponentFixture<LoopInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
