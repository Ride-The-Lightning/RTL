import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../shared/shared.module';

import { DataService } from '../../shared/services/data.service';
import { CommonService } from '../../shared/services/common.service';
import { mockDataService } from '../../shared/test-helpers/mock-services';

import { CLNLiquidityAdsComponent } from './liquidity-ads.component';

describe('CLNLiquidityAdsComponent', () => {
  let component: CLNLiquidityAdsComponent;
  let fixture: ComponentFixture<CLNLiquidityAdsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNLiquidityAdsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNLiquidityAdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
