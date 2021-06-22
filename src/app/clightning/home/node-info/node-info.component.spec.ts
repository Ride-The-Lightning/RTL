import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNodeInfoComponent } from './node-info.component';
import { CommonService } from '../../../shared/services/common.service';

describe('CLNodeInfoComponent', () => {
  let component: CLNodeInfoComponent;
  let fixture: ComponentFixture<CLNodeInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLNodeInfoComponent ],
      providers: [ CommonService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNodeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
