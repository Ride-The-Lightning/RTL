import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLNForwardingHistoryComponent } from './forwarding-history.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { RouterTestingModule } from '@angular/router/testing';
import { captureCSVDownload } from '../../../shared/test-helpers/csv-download';

describe('CLNForwardingHistoryComponent', () => {
  let component: CLNForwardingHistoryComponent;
  let fixture: ComponentFixture<CLNForwardingHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNForwardingHistoryComponent],
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The alias lookup sets out_channel_alias first when the out-channel comes first in the channel list (#1545)
  it('should export the fixed CSV columns whichever order an event\'s aliases were set in', async () => {
    component.loadForwardingEventsTable([{ created_index: 1, updated_index: 1, in_channel: '120x1x0', in_htlc_id: 0, out_channel: '157x1x0',
      out_htlc_id: 0, in_msat: 20000201, out_msat: 20000000, fee_msat: 201, status: 'settled', style: 'tlv', received_time: 1793926243.25,
      resolved_time: 1793926243.462816, out_channel_alias: 'eclair', in_channel_alias: 'alice' } as any]);
    const csv = await captureCSVDownload(() => component.onDownloadCSV());
    expect(csv).toBe('created_index,updated_index,payment_hash,in_channel,in_htlc_id,out_channel,out_htlc_id,in_msat,out_msat,fee_msat,' +
      'status,style,received_time,resolved_time,in_channel_alias,out_channel_alias\r\n' +
      '1,1,,120x1x0,0,157x1x0,0,20000201,20000000,201,settled,tlv,1793926243.25,1793926243.462816,alice,eclair\r\n');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
