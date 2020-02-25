import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoGraphicsComponent } from './info-graphics.component';

describe('InfoGraphicsComponent', () => {
  let component: InfoGraphicsComponent;
  let fixture: ComponentFixture<InfoGraphicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoGraphicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
