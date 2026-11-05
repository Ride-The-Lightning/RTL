import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { OnChainLabelModalComponent } from './on-chain-label-modal.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockDataService, mockMatDialogRef } from '../../../shared/test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('OnChainLabelModalComponent', () => {
  let component: OnChainLabelModalComponent;
  let fixture: ComponentFixture<OnChainLabelModalComponent>;
  const txidStr = '56941c4f0f3dab1441f4f83246cd8f05580e040b4a34d383fd1925176d50ec1b';
  const txidBytes = 'G+xQbRclGf2D0zRKCwQOWAWPzUYy+PRBFKs9D08clFY=';

  const setup = async (dialogData: any) => {
    await TestBed.configureTestingModule({
      declarations: [OnChainLabelModalComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    }).
      compileComponents();
    fixture = TestBed.createComponent(OnChainLabelModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', async () => {
    await setup({ utxo: {} });
    expect(component).toBeTruthy();
  });

  it('should label a UTXO\'s transaction by its outpoint txid bytes', async () => {
    await setup({ utxo: { label: 'old', outpoint: { txid_bytes: txidBytes, txid_str: txidStr, output_index: 0 } } });
    const labelSpy = spyOn(TestBed.inject(DataService), 'labelUTXO').and.callThrough();
    expect(component.label).toBe('old');
    component.label = 'Coffee';
    component.onLabelUTXO();
    expect(labelSpy).toHaveBeenCalledWith(txidBytes, 'Coffee', true);
  });

  it('should label a transaction by its hash converted to LND\'s txid bytes', async () => {
    await setup({ transaction: { tx_hash: txidStr, label: 'Salary', num_confirmations: 3 } });
    const labelSpy = spyOn(TestBed.inject(DataService), 'labelUTXO').and.callThrough();
    expect(component.label).toBe('Salary');
    expect(fixture.nativeElement.querySelector('.page-title').textContent).toContain('Label Transaction');
    component.label = 'Salary November';
    component.onLabelUTXO();
    expect(labelSpy).toHaveBeenCalledWith(txidBytes, 'Salary November', true);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
