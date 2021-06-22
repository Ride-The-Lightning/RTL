import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../shared/services/common.service';
import { ECLNodeInfoComponent } from './node-info.component';

describe('ECLNodeInfoComponent', () => {
  let component: ECLNodeInfoComponent;
  let fixture: ComponentFixture<ECLNodeInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLNodeInfoComponent ],
      providers: [ CommonService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLNodeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
