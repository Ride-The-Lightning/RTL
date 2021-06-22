import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLInvoiceInformationComponent } from './invoice-information.component';

describe('CLInvoiceInformationComponent', () => {
  let component: CLInvoiceInformationComponent;
  let fixture: ComponentFixture<CLInvoiceInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLInvoiceInformationComponent ],
      providers: [ LoggerService, CommonService, MatSnackBar, MatDialogRef ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLInvoiceInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
