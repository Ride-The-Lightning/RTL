import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggerService } from '../../services/logger.service';

import { HorizontalScrollerComponent } from './horizontal-scroller.component';

describe('HorizontalScrollerComponent', () => {
  let component: HorizontalScrollerComponent;
  let fixture: ComponentFixture<HorizontalScrollerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HorizontalScrollerComponent ],
      providers: [ LoggerService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizontalScrollerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
