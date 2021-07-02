import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLInvoiceInformationComponent } from './invoice-information.component';
import { mockDataService, mockMatDialogRef } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';
import { DataService } from '../../../shared/services/data.service';

describe('ECLInvoiceInformationComponent', () => {
  let component: ECLInvoiceInformationComponent;
  let fixture: ComponentFixture<ECLInvoiceInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLInvoiceInformationComponent ],
      imports: [ SharedModule ],
      providers: [ 
        LoggerService, CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {invoice:{}} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLInvoiceInformationComponent);
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
