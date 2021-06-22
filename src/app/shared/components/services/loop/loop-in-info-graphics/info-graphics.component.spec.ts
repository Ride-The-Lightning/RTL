import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../../services/common.service';

import { LoopInInfoGraphicsComponent } from './info-graphics.component';

describe('LoopInInfoGraphicsComponent', () => {
  let component: LoopInInfoGraphicsComponent;
  let fixture: ComponentFixture<LoopInInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopInInfoGraphicsComponent ],
      providers: [ CommonService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopInInfoGraphicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
