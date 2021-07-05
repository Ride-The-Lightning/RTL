import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { mockDataService } from '../../../shared/test-helpers/test-consts';
import { ECLNodeInfoComponent } from './node-info.component';

describe('ECLNodeInfoComponent', () => {
  let component: ECLNodeInfoComponent;
  let fixture: ComponentFixture<ECLNodeInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLNodeInfoComponent ],
      providers: [ 
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ECLNodeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
