import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { ChannelInformationComponent } from './channel-information.component';
import { mockDataService, mockMatDialogRef } from '../../../../shared/test-helpers/test-consts';
import { SharedModule } from '../../../../shared/shared.module';
import { DataService } from '../../../../shared/services/data.service';

describe('ChannelInformationComponent', () => {
  let component: ChannelInformationComponent;
  let fixture: ComponentFixture<ChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelInformationComponent ],
      imports: [ SharedModule ],
      providers: [ 
        LoggerService, CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {channel:{}} }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
