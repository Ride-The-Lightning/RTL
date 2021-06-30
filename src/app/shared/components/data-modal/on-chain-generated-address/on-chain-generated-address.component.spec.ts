import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';

import { OnChainGeneratedAddressComponent } from './on-chain-generated-address.component';
import { mockCommonService, mockMatDialogRef } from '../../../services/test-consts';
import { SharedModule } from '../../../shared.module';

describe('OnChainGeneratedAddressComponent', () => {
  let component: OnChainGeneratedAddressComponent;
  let fixture: ComponentFixture<OnChainGeneratedAddressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnChainGeneratedAddressComponent ],
      imports: [ SharedModule ],
      providers: [ 
        LoggerService, 
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {alertTitle: '', address: 'test', addressType: 'test'}},
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
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
