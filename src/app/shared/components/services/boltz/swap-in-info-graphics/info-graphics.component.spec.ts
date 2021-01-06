import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapInInfoGraphicsComponent } from './info-graphics.component';

describe('SwapInInfoGraphicsComponent', () => {
  let component: SwapInInfoGraphicsComponent;
  let fixture: ComponentFixture<SwapInInfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapInInfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapInInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
