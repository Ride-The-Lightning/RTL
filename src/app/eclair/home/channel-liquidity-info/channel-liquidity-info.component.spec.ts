import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CommonService } from '../../../shared/services/common.service';
import { mockCommonService } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';

import { ECLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';



describe('ECLChannelLiquidityInfoComponent', () => {
  let component: ECLChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<ECLChannelLiquidityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelLiquidityInfoComponent ],
      imports: [ SharedModule, RouterTestingModule ],
      providers: [ 
        { provide: CommonService, useClass: mockCommonService }
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
