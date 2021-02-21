import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopModalComponent } from './loop-modal.component';

describe('LoopModalComponent', () => {
  let component: LoopModalComponent;
  let fixture: ComponentFixture<LoopModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
