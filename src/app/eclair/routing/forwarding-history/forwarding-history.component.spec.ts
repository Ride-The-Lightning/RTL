import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLForwardingHistoryComponent } from './forwarding-history.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { captureCSVDownload } from '../../../shared/test-helpers/csv-download';

describe('ECLForwardingHistoryComponent', () => {
  let component: ECLForwardingHistoryComponent;
  let fixture: ComponentFixture<ECLForwardingHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLForwardingHistoryComponent],
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
    fixture = TestBed.createComponent(ECLForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CSV export (#1545)', () => {
    const header = 'type,paymentHash,fromChannelId,fromShortChannelId,fromChannelAlias,toChannelId,toShortChannelId,toChannelAlias,' +
      'amountIn,amountOut,receivedAt,settledAt,timestamp,incoming,outgoing';
    const cell = (csv: string, column: string) => {
      const [head, row] = csv.split('\r\n');
      return row.split(',')[head.split(',').indexOf(column)];
    };

    // An Eclair 0.13 relay as the backend returns it, aliased from-channel first
    it('should write the fixed columns for an Eclair 0.13 relay', async () => {
      component.loadForwardingEventsTable([{ type: 'payment-relayed', amountIn: 10010, amountOut: 10000, paymentHash: 'aa'.repeat(32),
        fromChannelId: 'c1'.repeat(32), toChannelId: 'c2'.repeat(32), receivedAt: { iso: '2025-06-01T00:00:00.000Z', unix: 1748736000 },
        settledAt: { iso: '2025-06-01T00:00:01.000Z', unix: 1748736001 }, timestamp: 1748736001000, fromChannelAlias: 'cln',
        fromShortChannelId: '157x1x0', toChannelAlias: 'alice', toShortChannelId: '142x1x0' } as any]);
      const csv = await captureCSVDownload(() => component.onDownloadCSV());
      expect(csv.split('\r\n')[0]).toBe(header);
      expect(cell(csv, 'fromChannelAlias')).toBe('cln');
      expect(cell(csv, 'toShortChannelId')).toBe('142x1x0');
      expect(cell(csv, 'incoming')).toBe('');
    });

    // An Eclair 0.14 relay as the backend returns it (from the fixture), aliased to-channel first
    it('should write the same columns for an Eclair 0.14 relay', async () => {
      component.loadForwardingEventsTable([{ type: 'payment-relayed', paymentHash: 'fb'.repeat(32),
        incoming: [{ channelId: 'c1'.repeat(32), remoteNodeId: '02'.repeat(33), amount: 10010000, receivedAt: { iso: '2026-11-06T01:53:08.352Z', unix: 1793929988 } }],
        outgoing: [{ channelId: 'c2'.repeat(32), remoteNodeId: '03'.repeat(33), amount: 10000000, settledAt: { iso: '2026-11-06T01:53:08.483Z', unix: 1793929988 } }],
        amountIn: 10010, amountOut: 10000, fromChannelId: 'c1'.repeat(32), toChannelId: 'c2'.repeat(32),
        settledAt: { iso: '2026-11-06T01:53:08.483Z', unix: 1793929988 }, timestamp: 1793929988000, toChannelAlias: 'alice',
        toShortChannelId: '142x1x0', fromChannelAlias: 'cln', fromShortChannelId: '157x1x0' } as any]);
      const csv = await captureCSVDownload(() => component.onDownloadCSV());
      expect(csv.split('\r\n')[0]).toBe(header);
      expect(cell(csv, 'fromChannelAlias')).toBe('cln');
      expect(cell(csv, 'toShortChannelId')).toBe('142x1x0');
      expect(cell(csv, 'receivedAt')).toBe('');
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
