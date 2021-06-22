import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';

import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { ECLChannelInformationComponent } from './channel-information.component';

describe('ECLChannelInformationComponent', () => {
  let component: ECLChannelInformationComponent;
  let fixture: ComponentFixture<ECLChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelInformationComponent ],
      providers: [ LoggerService, CommonService, MatSnackBar, MatDialogRef ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
