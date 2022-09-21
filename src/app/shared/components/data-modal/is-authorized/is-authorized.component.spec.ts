import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { IsAuthorizedComponent } from './is-authorized.component';
import { SharedModule } from '../../../shared.module';
import { mockMatDialogRef, mockRTLEffects } from '../../../test-helpers/mock-services';
import { RTLEffects } from '../../../../store/rtl.effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('IsAuthorizedComponent', () => {
  let component: IsAuthorizedComponent;
  let fixture: ComponentFixture<IsAuthorizedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [IsAuthorizedComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { appConfig: {} } },
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IsAuthorizedComponent);
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
