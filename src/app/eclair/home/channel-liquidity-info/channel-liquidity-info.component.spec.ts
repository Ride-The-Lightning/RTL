import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

import { ECLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

describe('ECLChannelLiquidityInfoComponent', () => {
  let component: ECLChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<ECLChannelLiquidityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLChannelLiquidityInfoComponent],
      imports: [SharedModule, RouterTestingModule],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelLiquidityInfoComponent);
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
