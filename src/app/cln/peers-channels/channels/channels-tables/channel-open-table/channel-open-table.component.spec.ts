import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../../../../shared/services/common.service';
import { DataService } from '../../../../../shared/services/data.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects, mockRouter } from '../../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../../shared/shared.module';
import { RTLEffects } from '../../../../../store/rtl.effects';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CLNEffects } from '../../../../store/cln.effects';
import { CLNChannelOpenTableComponent } from './channel-open-table.component';
import { ExtraOptions, Route, Router } from '@angular/router';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';

describe('CLNChannelOpenTableComponent', () => {
  let component: CLNChannelOpenTableComponent;
  let fixture: ComponentFixture<CLNChannelOpenTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNChannelOpenTableComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        CommonService,
        { provide: Router, useClass: mockRouter },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CLNEffects, useClass: mockCLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNChannelOpenTableComponent);
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

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
