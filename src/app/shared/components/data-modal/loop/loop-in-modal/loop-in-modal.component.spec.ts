import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopInModalComponent } from './loop-in-modal.component';

describe('LoopInModalComponent', () => {
  let component: LoopInModalComponent;
  let fixture: ComponentFixture<LoopInModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopInModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopInModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
