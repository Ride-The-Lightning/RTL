import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonService } from '../../../shared/services/common.service';

import { CLChannelLiquidityInfoComponent } from './channel-liquidity-info.component';

describe('CLChannelLiquidityInfoComponent', () => {
  let component: CLChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<CLChannelLiquidityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelLiquidityInfoComponent ],
      imports: [ RouterTestingModule ],
      providers: [ CommonService ]
    })
    .compileComponents();
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
