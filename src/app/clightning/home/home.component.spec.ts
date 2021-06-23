import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../../shared/shared.module';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLHomeComponent } from './home.component';

const mockCommonService = jasmine.createSpyObj("CommonService", ["getScreenSize", "setScreenSize", "getContainerSize", "setContainerSize", "sortByKey", "sortDescByKey", "sortAscByKey", "camelCase", "titleCase", "convertCurrency", "convertWithoutFiat", "convertWithFiat", "convertTime", "downloadFile", "convertToCSV", "isVersionCompatible"]);
const mockRTLEffects = jasmine.createSpyObj("RTLEffects", ["closeAllDialogs", "openSnackBar", "openSpinner", "closeSpinner", "openAlert", "closeAlert", "openConfirm", "closeConfirm", "showNodePubkey", "appConfigFetch", "settingSave", "updateServicesettings", "ssoSave", "twoFASettingSave", "configFetch", "showLnConfig", "isAuthorized", "isAuthorizedRes", "authLogin", "tokenVerify", "logOut", "resetPassword", "setSelectedNode", "fetchFile", "showFile", "initializeNode", "SetToken", "setLoggedInDetails", "handleErrorWithoutAlert", "handleErrorWithAlert", "ngOnDestroy"]);
const mockCLEffects = jasmine.createSpyObj("CLEffects", ["infoFetchCL", "fetchFeesCL", "fetchFeeRatesCL", "fetchBalanceCL", "fetchLocalRemoteBalanceCL", "getNewAddressCL", "setNewAddressCL", "peersFetchCL", "saveNewPeerCL", "detachPeerCL", "channelsFetchCL", "openNewChannelCL", "updateChannelCL", "closeChannelCL", "paymentsFetchCL", "decodePaymentCL", "setDecodedPaymentCL", "sendPaymentCL", "queryRoutesFetchCL", "setQueryRoutesCL", "peerLookupCL", "channelLookupCL", "invoiceLookupCL", "setLookupCL", "fetchForwardingHistoryCL", "deleteExpiredInvoiceCL", "saveNewInvoiceCL", "invoicesFetchCL", "SetChannelTransactionCL", "utxosFetch", "initializeRemainingData", "handleErrorWithoutAlert", "handleErrorWithAlert", "ngOnDestroy"]);

describe('CLHomeComponent', () => {
  let component: CLHomeComponent;
  let fixture: ComponentFixture<CLHomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLHomeComponent ],
      imports: [ 
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([]),
      ],
      providers: [
        LoggerService,
        { provide: CommonService, useValue: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
