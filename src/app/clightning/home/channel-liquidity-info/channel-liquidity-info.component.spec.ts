import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../shared/shared.module';
import { CommonService } from '../../../shared/services/common.service';
import { mockDataService } from '../../../shared/test-helpers/mock-services';

import { CLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';
import { DataService } from '../../../shared/services/data.service';

describe('CLChannelLiquidityInfoComponent', () => {
  let component: CLChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<CLChannelLiquidityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLChannelLiquidityInfoComponent],
      imports: [SharedModule, RouterTestingModule],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
