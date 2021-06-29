import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { LoopService } from '../../../../../shared/services/loop.service';

import { LoopModalComponent } from './loop-modal.component';
import { SharedModule } from '../../../../shared.module';
import { mockCommonService, mockLoopService, mockMatDialogRef } from '../../../../services/test-consts';

describe('LoopModalComponent', () => {
  let component: LoopModalComponent;
  let fixture: ComponentFixture<LoopModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopModalComponent ],
      imports: [ 
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [ 
        LoggerService,
        { provide: LoopService, useClass: mockLoopService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {channel: {}, minQuote: {}, maxQuote: {}, direction: ''} },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
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
