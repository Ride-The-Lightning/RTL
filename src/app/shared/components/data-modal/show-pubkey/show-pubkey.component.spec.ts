import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';

import { ShowPubkeyComponent } from './show-pubkey.component';
import { mockCommonService, mockMatDialogRef } from '../../../services/test-consts';
import { SharedModule } from '../../../shared.module';

describe('ShowPubkeyComponent', () => {
  let component: ShowPubkeyComponent;
  let fixture: ComponentFixture<ShowPubkeyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPubkeyComponent ],
      imports: [ SharedModule ],
      providers: [ 
        LoggerService, 
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {information:{identity_pubkey: 'test'}} },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPubkeyComponent);
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
