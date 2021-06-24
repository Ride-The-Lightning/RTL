import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { mockCommonService, mockMatDialogRef } from '../../../../shared/services/test-consts';
import { SharedModule } from '../../../../shared/shared.module';

import { CLChannelInformationComponent } from './channel-information.component';

describe('CLChannelInformationComponent', () => {
  let component: CLChannelInformationComponent;
  let fixture: ComponentFixture<CLChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelInformationComponent ],
      imports: [ 
        SharedModule
      ],
      providers: [
        LoggerService,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {channel:{}} },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelInformationComponent);
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
