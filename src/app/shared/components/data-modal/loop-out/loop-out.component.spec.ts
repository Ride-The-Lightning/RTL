import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopOutComponent } from './loop-out.component';

describe('LoopOutComponent', () => {
  let component: LoopOutComponent;
  let fixture: ComponentFixture<LoopOutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopOutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
