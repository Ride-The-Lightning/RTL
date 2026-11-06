import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLNFailedTransactionsComponent } from './failed-transactions.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { captureCSVDownload } from '../../../shared/test-helpers/csv-download';

describe('CLNFailedTransactionsComponent', () => {
  let component: CLNFailedTransactionsComponent;
  let fixture: ComponentFixture<CLNFailedTransactionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNFailedTransactionsComponent],
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
    fixture = TestBed.createComponent(CLNFailedTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The alias lookup sets out_channel_alias first when the out-channel comes first in the channel list (#1545)
  it('should export the fixed CSV columns whichever order an event\'s aliases were set in', async () => {
    component.loadFailedEventsTable([{ created_index: 3, updated_index: 4, in_channel: '120x1x0', in_htlc_id: 2, out_channel: '157x1x0',
      out_htlc_id: 1, in_msat: 5000050, out_msat: 5000000, fee_msat: 50, status: 'failed', style: 'tlv', received_time: 1793926400.25,
      resolved_time: 1793926400.75, out_channel_alias: 'eclair', in_channel_alias: 'alice' } as any]);
    const csv = await captureCSVDownload(() => component.onDownloadCSV());
    expect(csv).toBe('created_index,updated_index,payment_hash,in_channel,in_htlc_id,out_channel,out_htlc_id,in_msat,out_msat,fee_msat,' +
      'status,style,received_time,resolved_time,failcode,failreason,in_channel_alias,out_channel_alias\r\n' +
      '3,4,,120x1x0,2,157x1x0,1,5000050,5000000,50,failed,tlv,1793926400.25,1793926400.75,,,alice,eclair\r\n');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
