import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLNLocalFailedTransactionsComponent } from './local-failed-transactions.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { captureCSVDownload } from '../../../shared/test-helpers/csv-download';

describe('CLNLocalFailedTransactionsComponent', () => {
  let component: CLNLocalFailedTransactionsComponent;
  let fixture: ComponentFixture<CLNLocalFailedTransactionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNLocalFailedTransactionsComponent],
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
    fixture = TestBed.createComponent(CLNLocalFailedTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The alias lookup sets out_channel_alias first when the out-channel comes first in the channel list (#1545)
  it('should export the fixed CSV columns whichever order an event\'s aliases were set in', async () => {
    component.loadLocalfailedLocalEventsTable([{ created_index: 2, updated_index: 2, in_channel: '120x1x0', in_htlc_id: 1, out_channel: '157x1x0',
      in_msat: 5000050, status: 'local_failed', style: 'tlv', received_time: 1793926300.5, failcode: 4103,
      failreason: 'WIRE_TEMPORARY_CHANNEL_FAILURE', out_channel_alias: 'eclair', in_channel_alias: 'alice' } as any]);
    const csv = await captureCSVDownload(() => component.onDownloadCSV());
    expect(csv).toBe('created_index,updated_index,payment_hash,in_channel,in_htlc_id,out_channel,out_htlc_id,in_msat,out_msat,fee_msat,' +
      'status,style,received_time,resolved_time,failcode,failreason,in_channel_alias,out_channel_alias\r\n' +
      '2,2,,120x1x0,1,157x1x0,,5000050,,,local_failed,tlv,1793926300.5,,4103,WIRE_TEMPORARY_CHANNEL_FAILURE,alice,eclair\r\n');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
