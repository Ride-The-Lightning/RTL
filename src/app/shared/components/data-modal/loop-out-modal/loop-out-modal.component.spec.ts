import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopOutModalComponent } from './loop-out-modal.component';

describe('LoopOutModalComponent', () => {
  let component: LoopOutModalComponent;
  let fixture: ComponentFixture<LoopOutModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopOutModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopOutModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
