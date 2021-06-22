import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../../../shared/services/common.service';

import { LoopOutInfoGraphicsComponent } from './info-graphics.component';

describe('LoopOutInfoGraphicsComponent', () => {
  let component: LoopOutInfoGraphicsComponent;
  let fixture: ComponentFixture<LoopOutInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopOutInfoGraphicsComponent ],
      providers: [ CommonService ]
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
