import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared/shared.module';
import { CommonService } from '../../../shared/services/common.service';

import { CLNodeInfoComponent } from './node-info.component';

const mockCommonService = jasmine.createSpyObj("CommonService", ["getScreenSize", "setScreenSize", "getContainerSize", "setContainerSize", "sortByKey", "sortDescByKey", "sortAscByKey", "camelCase", "titleCase", "convertCurrency", "convertWithoutFiat", "convertWithFiat", "convertTime", "downloadFile", "convertToCSV", "isVersionCompatible"]);

describe('CLNodeInfoComponent', () => {
  let component: CLNodeInfoComponent;
  let fixture: ComponentFixture<CLNodeInfoComponent>;
  let commonService: CommonService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLNodeInfoComponent ],
      imports: [ SharedModule ],
      providers: [ 
        { provide: CommonService, useValue: mockCommonService }
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
});
