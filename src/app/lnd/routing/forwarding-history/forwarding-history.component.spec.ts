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

  describe('CSV export', () => {
    const columns = ['timestamp', 'chan_id_in', 'chan_id_out', 'amt_in', 'amt_out', 'fee', 'fee_msat', 'amt_in_msat', 'amt_out_msat', 'timestamp_ns', 'peer_alias_in', 'peer_alias_out', 'alias_in', 'alias_out', 'incoming_htlc_id', 'outgoing_htlc_id'];
    let exportedBlob: Blob;

    beforeEach(() => {
      spyOn(URL, 'createObjectURL').and.callFake((blob: Blob) => {
        exportedBlob = blob;
        return 'blob:synthetic-csv';
      });
      spyOn(HTMLAnchorElement.prototype, 'click');
    });

    async function exportCSV(records: any[]): Promise<string> {
      component.forwardingHistoryEvents.data = records;
      component.onDownloadCSV();
      expect(exportedBlob.type).toBe('text/csv;charset=utf-8;');
      return new TextDecoder('utf-8', { ignoreBOM: true }).decode(await exportedBlob.arrayBuffer());
    }

    it('keeps the same header across dates, optional HTLC IDs and property insertion orders', async () => {
      const oldEvent = { timestamp: 1, chan_id_in: '11', chan_id_out: '22', alias_in: 'in', alias_out: 'out' };
      const newEvent = { outgoing_htlc_id: '44', alias_out: 'out', incoming_htlc_id: '33', alias_in: 'in', chan_id_out: '22', chan_id_in: '11', timestamp: 2 };
      const header = '\ufeff' + columns.join(',');
      expect((await exportCSV([oldEvent])).split('\r\n')[0]).toBe(header);
      expect((await exportCSV([newEvent])).split('\r\n')[0]).toBe(header);
      expect((await exportCSV([newEvent, oldEvent])).split('\r\n')[0]).toBe(header);
      const csv = await exportCSV([oldEvent, newEvent]);
      expect(csv).toBe(header + '\r\n' +
        '1,11,22,,,,,,,,,,in,out,,\r\n' +
        '2,11,22,,,,,,,,,,in,out,33,44\r\n');
      expect(oldEvent).toEqual({ timestamp: 1, chan_id_in: '11', chan_id_out: '22', alias_in: 'in', alias_out: 'out' });
    });

    it('retains unknown fields in sorted trailing columns and preserves quoting, empty cells and formula protection', async () => {
      const first = { alias_out: '=1+1', alias_in: 'a,"b"\r\nc', z_extra: 'z', 'a,extra': '' };
      const second = { 'a,extra': 'a', incoming_htlc_id: 0, outgoing_htlc_id: '0', alias_in: '', z_extra: 'other' };
      const header = '\ufeff' + columns.join(',') + ',"a,extra",z_extra';
      const empty = Array(12).fill('').join(',') + ',';
      expect(await exportCSV([first, second])).toBe(header + '\r\n' +
        empty + '"a,""b""\r\nc",\'=1+1,,,,z\r\n' +
        empty + ',,0,0,a,other\r\n');
      expect((await exportCSV([second, first])).split('\r\n')[0]).toBe(header);
    });

    it('does not download an empty report', () => {
      component.forwardingHistoryEvents.data = [];
      component.onDownloadCSV();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
