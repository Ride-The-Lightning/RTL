import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';

import { CLNChannelInformationComponent } from './channel-information.component';

describe('CLNChannelInformationComponent', () => {
  let component: CLNChannelInformationComponent;
  let fixture: ComponentFixture<CLNChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNChannelInformationComponent],
      imports: [
        SharedModule
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: {}, selNode: { settings: {} } } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Issue #1733: closing progress of a CLN channel that is no longer CHANNELD_NORMAL.
  const renderChannel = (channel: any) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [CLNChannelInformationComponent],
      imports: [SharedModule],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: channel, selNode: { settings: {} } } }
      ]
    });
    fixture = TestBed.createComponent(CLNChannelInformationComponent);
    fixture.detectChanges();
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ');
  };

  const valueUnder = (heading: string): string => {
    const h4 = Array.from(fixture.nativeElement.querySelectorAll('h4') as NodeListOf<HTMLElement>).find((el) => el.textContent?.trim() === heading);
    return h4?.nextElementSibling?.textContent?.replace(/\s+/g, ' ').trim() || '';
  };

  const onchainChannel = {
    state: 'ONCHAIN',
    closer: 'local',
    scratch_txid: 'aa'.repeat(32),
    status: [
      'CHANNELD_NORMAL:Received ERROR channel abc: failing channel',
      'ONCHAIN:Tracking our own unilateral close',
      'ONCHAIN:1 outputs unresolved: in 13 blocks will spend DELAYED_OUTPUT_TO_US (txid:2) using OUR_DELAYED_RETURN_TO_WALLET'
    ],
    state_changes: [{ timestamp: '2026-10-01T10:00:00.000Z', old_state: 'CHANNELD_NORMAL', new_state: 'AWAITING_UNILATERAL', cause: 'user', message: 'Forcibly closed by RPC call' }]
  };

  it('should show the sweep countdown, closer, close transaction and status latest first', () => {
    const text = renderChannel(onchainChannel);
    expect(text).toContain('Sweep in 13 blocks');
    expect(valueUnder('Closed By')).toBe('Local');
    expect(valueUnder('Close Transaction ID')).toBe('aa'.repeat(32));
    expect(text.indexOf('in 13 blocks will spend')).toBeLessThan(text.indexOf('Tracking our own unilateral close'));
    expect(text.indexOf('Tracking our own unilateral close')).toBeLessThan(text.indexOf('failing channel'));
  });

  it('should list state changes under advanced', () => {
    expect(renderChannel(onchainChannel)).not.toContain('Forcibly closed by RPC call');
    fixture.componentInstance.onShowAdvanced();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.replace(/\s+/g, ' ')).toContain('Channeld Normal to Awaiting Unilateral (User): Forcibly closed by RPC call');
  });

  it('should not show a close transaction when the peer force-closed', () => {
    renderChannel({ ...onchainChannel, closer: 'remote', status: ['ONCHAIN:Tracking their unilateral close', 'ONCHAIN:All outputs resolved: waiting 99 more blocks before forgetting channel'] });
    expect(valueUnder('Closed By')).toBe('Remote');
    expect(valueUnder('Close Transaction ID')).toBe('');
  });

  it('should not show closing details for a normal channel', () => {
    const text = renderChannel({ state: 'CHANNELD_NORMAL', scratch_txid: 'bb'.repeat(32), status: ['CHANNELD_NORMAL:Channel ready for use.'] });
    expect(text).not.toContain('Close Transaction ID');
    expect(text).not.toContain('Channel ready for use.');
    expect(text).not.toContain('Sweep in');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
