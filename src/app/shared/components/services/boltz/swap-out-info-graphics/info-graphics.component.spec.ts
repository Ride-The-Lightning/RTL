import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapOutInfoGraphicsComponent } from './info-graphics.component';

describe('SwapOutInfoGraphicsComponent', () => {
  let component: SwapOutInfoGraphicsComponent;
  let fixture: ComponentFixture<SwapOutInfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapOutInfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapOutInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
