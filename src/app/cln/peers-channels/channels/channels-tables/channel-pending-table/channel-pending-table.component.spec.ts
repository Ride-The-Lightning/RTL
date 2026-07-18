import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { CLNChannelPendingTableComponent } from './channel-pending-table.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { SharedModule } from '../../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../../shared/services/data.service';
import { MatTableDataSource } from '@angular/material/table';

describe('CLNChannelPendingTableComponent', () => {
  let component: CLNChannelPendingTableComponent;
  let fixture: ComponentFixture<CLNChannelPendingTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNChannelPendingTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNChannelPendingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const connectedCellText = (): string => {
    const cell = fixture.nativeElement.querySelector('td.mat-column-connected');
    return cell ? cell.textContent.trim() : '';
  };

  const renderSingleChannel = (channel: any) => {
    component.displayedColumns = ['connected'];
    component.channels = new MatTableDataSource<any>([channel]);
    fixture.detectChanges();
  };

  // Issue #1606: the connected column must reflect peer_connected (what listpeerchannels
  // returns), not the legacy 'connected' field, so it stays consistent with the detail panel.
  it('should render Connected from peer_connected even when legacy connected is false', () => {
    renderSingleChannel({ peer_connected: true, connected: false });
    expect(connectedCellText()).toBe('Connected');
  });

  it('should render Disconnected from peer_connected even when legacy connected is true', () => {
    renderSingleChannel({ peer_connected: false, connected: true });
    expect(connectedCellText()).toBe('Disconnected');
  });

  // Issue #1606: the channel information modal reads selNode.settings.blockExplorerUrl, so the
  // pending table must pass selNode when opening it. Without it the modal throws mid-render and
  // blanks State/Connected/balances for disconnected channels (which live in this table).
  it('should pass selNode when opening the channel information modal', () => {
    const store = TestBed.inject(Store);
    const dispatchSpy = spyOn(store, 'dispatch');
    const selNode: any = { settings: { blockExplorerUrl: 'https://mempool.space' } };
    component.selNode = selNode;
    component.onChannelClick({ short_channel_id: '120x1x0', peer_connected: false } as any, {} as any);
    expect(dispatchSpy).toHaveBeenCalled();
    const action: any = dispatchSpy.calls.mostRecent().args[0];
    expect(action.payload.data.selNode).toBe(selNode);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
