import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../shared/shared.module';
import { CommonService } from '../../../shared/services/common.service';

import { CLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

const mockCommonService = jasmine.createSpyObj("CommonService", ["getScreenSize", "setScreenSize", "getContainerSize", "setContainerSize", "sortByKey", "sortDescByKey", "sortAscByKey", "camelCase", "titleCase", "convertCurrency", "convertWithoutFiat", "convertWithFiat", "convertTime", "downloadFile", "convertToCSV", "isVersionCompatible"]);

describe('CLChannelLiquidityInfoComponent', () => {
  let component: CLChannelLiquidityInfoComponent;  
  let commonService: CommonService;  
  let fixture: ComponentFixture<CLChannelLiquidityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelLiquidityInfoComponent ],
      imports: [ RouterTestingModule, SharedModule ],
      providers: [ 
        { provide: CommonService, useValue: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    commonService = TestBed.inject<CommonService>(CommonService);
    fixture.detectChanges();
  });

  it('should create', () => {
    console.warn(commonService);
    expect(component).toBeTruthy();
  });

  it('should create common service', () => {
    expect(commonService).toBeTruthy();
  });  
});
