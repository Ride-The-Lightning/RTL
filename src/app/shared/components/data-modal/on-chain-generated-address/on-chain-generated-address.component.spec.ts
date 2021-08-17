import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';

import { OnChainGeneratedAddressComponent } from './on-chain-generated-address.component';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../test-helpers/mock-services';
import { SharedModule } from '../../../shared.module';
import { DataService } from '../../../services/data.service';

describe('OnChainGeneratedAddressComponent', () => {
  let component: OnChainGeneratedAddressComponent;
  let fixture: ComponentFixture<OnChainGeneratedAddressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OnChainGeneratedAddressComponent],
      imports: [SharedModule],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { alertTitle: '', address: 'test', addressType: 'test' } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnChainGeneratedAddressComponent);
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
