import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';

import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { ECLChannelInformationComponent } from './channel-information.component';
import { SharedModule } from '../../../../shared/shared.module';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../../shared/test-helpers/mock-services';
import { DataService } from '../../../../shared/services/data.service';

describe('ECLChannelInformationComponent', () => {
  let component: ECLChannelInformationComponent;
  let fixture: ComponentFixture<ECLChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLChannelInformationComponent],
      imports: [SharedModule, StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: {} } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('funding transaction id (#634)', () => {
    const fundingTxId = 'cc69154417fa65d7a8aea539a1b151a4b5a91e559d0de06f9ab180891e94b8bc';
    const row = () => Array.from(fixture.nativeElement.querySelectorAll('h4')).find((el: any) => el.textContent.trim() === 'Funding Transaction ID') as any;
    const show = (channel: any) => {
      component.channel = channel;
      fixture.detectChanges();
    };

    it('should show the funding transaction id of the channel', () => {
      show({ channelId: 'bcb8941e8980b19a6fe00d9d551ea9b5a451b1a139a5aea8d765fa17441569cc', fundingTxId: fundingTxId });
      expect(row().nextElementSibling.textContent.trim()).toBe(fundingTxId);
    });

    it('should open the transaction on the node\'s block explorer', () => {
      const open = spyOn(window, 'open');
      show({ fundingTxId: fundingTxId });
      row().nextElementSibling.querySelector('fa-icon').click();
      expect(open).toHaveBeenCalledOnceWith('https://mempool.space/tx/' + fundingTxId, '_blank', 'noopener,noreferrer');
    });

    it('should leave the row out for a channel that has no funding transaction yet', () => {
      show({ channelId: '22'.repeat(32), state: 'WAIT_FOR_FUNDING_INTERNAL', fundingTxId: '' });
      expect(row()).toBeUndefined();
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
