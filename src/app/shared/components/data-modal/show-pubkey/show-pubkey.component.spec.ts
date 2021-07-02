import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';

import { ShowPubkeyComponent } from './show-pubkey.component';
import { mockDataService, mockMatDialogRef } from '../../../services/test-consts';
import { SharedModule } from '../../../shared.module';
import { DataService } from '../../../services/data.service';

describe('ShowPubkeyComponent', () => {
  let component: ShowPubkeyComponent;
  let fixture: ComponentFixture<ShowPubkeyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPubkeyComponent ],
      imports: [ SharedModule ],
      providers: [ 
        LoggerService, CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {information:{identity_pubkey: 'test'}} }
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
