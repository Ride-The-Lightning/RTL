import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '../../../shared/shared.module';

import { DataService } from '../../../shared/services/data.service';
import { CommonService } from '../../../shared/services/common.service';
import { mockDataService } from '../../../shared/test-helpers/mock-services';

import { CLNLiquidityAdsListComponent } from './liquidity-ads-list.component';

describe('CLNLiquidityAdsListComponent', () => {
  let component: CLNLiquidityAdsListComponent;
  let fixture: ComponentFixture<CLNLiquidityAdsListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNLiquidityAdsListComponent],
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
    fixture = TestBed.createComponent(CLNLiquidityAdsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
