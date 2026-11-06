import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ForwardingHistoryComponent } from './forwarding-history.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { captureCSVDownload } from '../../../shared/test-helpers/csv-download';

describe('ForwardingHistoryComponent', () => {
  let component: ForwardingHistoryComponent;
  let fixture: ComponentFixture<ForwardingHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ForwardingHistoryComponent],
      imports: [
        BrowserAnimationsModule,
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
    fixture = TestBed.createComponent(ForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CSV export (#1545)', () => {
    const header = 'timestamp,chan_id_in,chan_id_out,amt_in,amt_out,fee,fee_msat,amt_in_msat,amt_out_msat,timestamp_ns,' +
      'peer_alias_in,peer_alias_out,incoming_htlc_id,outgoing_htlc_id,alias_in,alias_out';
    const cell = (csv: string, column: string) => {
      const [head, row] = csv.split('\r\n');
      return row.split(',')[head.split(',').indexOf(column)];
    };

    // An event from an LND release before incoming_htlc_id/outgoing_htlc_id, aliased in-channel first
    it('should write the fixed columns for an event without HTLC ids', async () => {
      component.loadForwardingEventsTable([{ timestamp: '1717200000', chan_id_in: '111', chan_id_out: '222', amt_in: '50', amt_out: '40', fee: '10',
        fee_msat: '10000', amt_in_msat: '50000', amt_out_msat: '40000', timestamp_ns: '1717200000000000000', peer_alias_in: 'bob',
        peer_alias_out: 'eclair', alias_in: 'bob', alias_out: 'eclair' } as any]);
      const csv = await captureCSVDownload(() => component.onDownloadCSV());
      expect(csv.split('\r\n')[0]).toBe(header);
      expect(cell(csv, 'incoming_htlc_id')).toBe('');
      expect(cell(csv, 'alias_in')).toBe('bob');
      expect(cell(csv, 'alias_out')).toBe('eclair');
    });

    // An event from a current LND, aliased out-channel first, as the issue's November export was
    it('should write the same columns for an event with HTLC ids', async () => {
      component.loadForwardingEventsTable([{ timestamp: '1792343166', chan_id_in: '111', chan_id_out: '222', amt_in: '50', amt_out: '40', fee: '10',
        fee_msat: '10000', amt_in_msat: '50000', amt_out_msat: '40000', timestamp_ns: '1792343166295899928', peer_alias_in: 'bob',
        peer_alias_out: 'eclair', incoming_htlc_id: '3', outgoing_htlc_id: '0', alias_out: 'eclair', alias_in: 'bob' } as any]);
      const csv = await captureCSVDownload(() => component.onDownloadCSV());
      expect(csv.split('\r\n')[0]).toBe(header);
      expect(cell(csv, 'incoming_htlc_id')).toBe('3');
      expect(cell(csv, 'alias_in')).toBe('bob');
      expect(cell(csv, 'alias_out')).toBe('eclair');
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
