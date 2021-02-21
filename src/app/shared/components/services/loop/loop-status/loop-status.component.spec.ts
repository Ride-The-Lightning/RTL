import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopStatusComponent } from './loop-status.component';

describe('LoopStatusComponent', () => {
  let component: LoopStatusComponent;
  let fixture: ComponentFixture<LoopStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
