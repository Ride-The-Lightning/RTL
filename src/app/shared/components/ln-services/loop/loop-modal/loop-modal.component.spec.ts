import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';

import { LoopModalComponent } from './loop-modal.component';
import { SharedModule } from '../../../../shared.module';
import { mockDataService, mockLoggerService, mockLoopService, mockMatDialogRef } from '../../../../test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../../services/data.service';

describe('LoopModalComponent', () => {
  let component: LoopModalComponent;
  let fixture: ComponentFixture<LoopModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoopModalComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: LoopService, useClass: mockLoopService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: {}, minQuote: {}, maxQuote: {}, direction: '' } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
