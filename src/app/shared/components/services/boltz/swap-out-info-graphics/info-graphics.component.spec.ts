import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../../../shared/services/common.service';

import { SwapOutInfoGraphicsComponent } from './info-graphics.component';

describe('SwapOutInfoGraphicsComponent', () => {
  let component: SwapOutInfoGraphicsComponent;
  let fixture: ComponentFixture<SwapOutInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapOutInfoGraphicsComponent ],
      providers: [ CommonService ]
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
