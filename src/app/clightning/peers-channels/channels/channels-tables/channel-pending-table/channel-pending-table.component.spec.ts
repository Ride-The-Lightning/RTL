import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { CLChannelPendingTableComponent } from './channel-pending-table.component';

describe('CLChannelPendingTableComponent', () => {
  let component: CLChannelPendingTableComponent;
  let fixture: ComponentFixture<CLChannelPendingTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelPendingTableComponent ],
      imports: [
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
 ],
      providers: [ LoggerService, CommonService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelPendingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
