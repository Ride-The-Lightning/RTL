import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoopOutInfoGraphicsComponent } from './info-graphics.component';

describe('LoopOutInfoGraphicsComponent', () => {
  let component: LoopOutInfoGraphicsComponent;
  let fixture: ComponentFixture<LoopOutInfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopOutInfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopOutInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
