import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../shared/services/common.service';
import { ECLNodeInfoComponent } from './node-info.component';

const mockCommonService = jasmine.createSpyObj("CommonService", ["getScreenSize", "setScreenSize", "getContainerSize", "setContainerSize", "sortByKey", "sortDescByKey", "sortAscByKey", "camelCase", "titleCase", "convertCurrency", "convertWithoutFiat", "convertWithFiat", "convertTime", "downloadFile", "convertToCSV", "isVersionCompatible"]);

describe('ECLNodeInfoComponent', () => {
  let component: ECLNodeInfoComponent;
  let fixture: ComponentFixture<ECLNodeInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLNodeInfoComponent ],
      providers: [ 
        { provide: CommonService, useValue: mockCommonService }
      ]
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
