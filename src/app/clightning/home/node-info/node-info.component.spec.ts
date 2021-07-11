import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared/shared.module';
import { CommonService } from '../../../shared/services/common.service';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';

import { CLNodeInfoComponent } from './node-info.component';
import { DataService } from '../../../shared/services/data.service';

describe('CLNodeInfoComponent', () => {
  let component: CLNodeInfoComponent;
  let fixture: ComponentFixture<CLNodeInfoComponent>;
  let commonService: CommonService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLNodeInfoComponent ],
      imports: [ SharedModule ],
      providers: [ 
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNodeInfoComponent);
    commonService = TestBed.inject(CommonService);    
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
