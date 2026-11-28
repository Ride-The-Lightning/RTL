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

  describe('fee in Sats (#468)', () => {
    const events = [{ in_channel: '120x1x0', out_channel: '157x1x0', in_msat: 20000201, out_msat: 20000000, fee_msat: 201, status: 'settled',
      received_time: 1793926243.25, resolved_time: 1793926243.46 }, { in_channel: '120x1x0', out_channel: '157x1x0', in_msat: 50027552,
      out_msat: 50000000, fee_msat: 27552, status: 'settled', received_time: 1793926300.25, resolved_time: 1793926300.46 }] as any[];
    const text = (selector: string) => Array.from(fixture.nativeElement.querySelectorAll(selector)).map((el: any) => el.textContent.trim());

    beforeEach(() => {
      component.displayedColumns = ['received_time', 'in_msatoshi', 'out_msatoshi', 'fee'];
      component.loadForwardingEventsTable(events);
      fixture.detectChanges();
    });

    it('should show the fee in Sats with the mSat part as decimals', () => {
      expect(text('th.mat-column-fee')).toEqual(['Fee (Sats)']);
      expect(text('td.mat-column-fee')).toEqual(jasmine.arrayWithExactContents(['0.201', '27.552']));
    });

    it('should filter the fee column by the Sats value shown', () => {
      component.selFilterBy = 'fee';
      component.selFilter = '27.5';
      component.applyFilter();
      expect(component.forwardingHistoryEvents.filteredData.map((event) => event.fee_msat)).toEqual([27552]);
    });
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

  it('should keep the actions cell as a table-cell and align its inner wrapper', () => {
    component.displayedColumns = ['received_time', 'fee', 'actions'];
    component.loadForwardingEventsTable([{ in_channel: '120x1x0', out_channel: '157x1x0', in_msat: 20000201, out_msat: 20000000, fee_msat: 201,
      status: 'settled', received_time: 1793926243.25, resolved_time: 1793926243.46 }] as any[]);
    fixture.detectChanges();
    const cell = fixture.nativeElement.querySelector('td.mat-column-actions') as HTMLElement;
    expect(getComputedStyle(cell).display).toBe('table-cell');
    const wrapper = cell.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('SPAN');
    expect(getComputedStyle(wrapper).display).toBe('flex');
    expect(getComputedStyle(wrapper).justifyContent).toMatch(/^(?:flex|flow)-end$/);
    expect(getComputedStyle(wrapper).alignItems).toBe('center');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
