import { HttpResponse } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { API_URL } from '../../../environments/environment';
import { CLNActions } from '../services/consts-enums-functions';
import { mockResponseData } from './test-data';

export class mockMatDialogRef {

  close = (dialogResult: any) => { };

}

export class mockLoggerService {

  info() { };
  warn() { };
  error() { };
  invokeConsoleMethod(type: string, args?: any): void { };

}

export class mockHttpClient {

  post(url: string) {
    return of(new HttpResponse(mockResponseData.setSelectedNodeSuccess));
  }

}

export class mockRouter {

  getCurrentNavigation() {
    return {
      extras: {
        state: {
          filter: 'DummyChannelID4325565432212367867'
        }
      }
    };
  };

}

export class mockDataService {

  private lnImplementation = 'LND';
  private APIUrl = API_URL;
  public lnImplementationUpdated: BehaviorSubject<string> = new BehaviorSubject(this.lnImplementation);

  setLnImplementation(lnImplementation: string) {
    this.lnImplementation = lnImplementation.toLowerCase();
    this.lnImplementationUpdated.next(this.lnImplementation);
  }

  getFiatRates() {
    return of(mockResponseData.fiatRates);
  }

  decodePayment(payment: string, fromDialog: boolean) {
    if (payment ===
      'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3'
    ) {
      return of(mockResponseData.decodePayment);
    } else if (payment ===
      'lntb1ps8neg8pp5u897fhxxzg068jzt59tgqe458jt7srjtd6k93x4t9ts3hqdkd2nsdpj23jhxarfdenjq3tdwp68jgzfdemx76trv5sxvmmjypxyu3pqxvxqyd9uqcqp2sp5feg8wftf3fasmp2fe86kehyqfat2xcrjvunare7rrn28yjdrw8yqrzjq2m42d94jc8fxjzq675cmhr7fpjg0vr6238xutxp9p78yeaucwjfjxgpcuqqqxsqqyqqqqlgqqqqqqgq9q9qy9qsqwf6a4w9uqthm3aslwt03ucqt03e8j2atxrmt022d5kaw65cmqc3pnghz5xmsh2tlz9syhaulrxtwmvh3gdx9j33gec6yrycwh2g05qgqdnftgk'
    ) {
      mockResponseData.decodeEmptyPayment.num_satoshis = '0';
      return of(mockResponseData.decodeEmptyPayment);
    } else {
      return throwError(() => mockResponseData.error);
    }
  };

  decodePayments(payments: string) {
    return of(mockResponseData.decodePayments);
  };

  getAliasesFromPubkeys(pubkey: string, multiple: boolean) {
    return of(mockResponseData.getAliasesFromPubkeys);
  };

  signMessage(msg: string) {
    return of(mockResponseData.signMessage);
  };

  verifyMessage(msg: string, sign: string) {
    return of(mockResponseData.verifyMessage);
  };

  bumpFee(txid: string, outputIndex: number, targetConf: number, satPerByte: number) {
    return of(mockResponseData.bumpFee);
  };

  labelUTXO(txid: string, label: string, overwrite: boolean = true) {
    return of(mockResponseData.labelUTXO);
  };

  leaseUTXO(txid: string, output_index: number) {
    return of(mockResponseData.leaseUTXO); // 10 mins
  };

  listConfigs() {
    return of({ '# version': 'v0.10.2-55-g35c6f90', network: 'testnet', 'experimental-dual-fund': true, 'experimental-offers': true, rgb: '009001', alias: 'MyTestNode', 'watchtime-blocks': 6 });
  }

  getForwardingHistory(start: string, end: string) {
    return of(mockResponseData.getForwardingHistory);
  };

  listNetworkNodes(qp: string) {
    return of(mockResponseData.getListLiqNode);
  };

};

export class mockSessionService {

  private sessionObj = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiTk9ERV9VU0VSIiwiY29uZmlnUGF0aCI6IkM6L1VzZXJzL3NoYWhhL0FwcERhdGEvTG9jYWwvTG5kL2xuZC5jb25mIiwibWFjYXJvb25QYXRoIjoiQzovVXNlcnMvc2hhaGEvQXBwRGF0YS9Mb2NhbC9MbmQvZGF0YS9jaGFpbi9iaXRjb2luL3Rlc3RuZXQiLCJpYXQiOjE2MjU4NzcwMzZ9.ybM926PINgy3RINjG1CPqQOOFOcofgKbBLLeyfgW4zg',
    defaultPassword: false,
    lndUnlocked: true
  };

  watchSession() {
    return of(this.sessionObj);
  }

  getItem(key) {
    return this.sessionObj[key];
  }

  getAllItems() {
    return this.sessionObj;
  }

  setItem(key: string, data: any) {
    return of(this.sessionObj);
  }

  removeItem(key) {
    return of(this.sessionObj);
  }

  clearAll() {
    return of(this.sessionObj);
  }

}

export class mockLoopService {

  public swapsChanged = new BehaviorSubject<any[]>([]);
  getSwapsList() { };
  listSwaps() { };
  loopOut(amount: number, chanId: string, targetConf: number, swapRoutingFee: number, minerFee: number, prepayRoutingFee: number, prepayAmt: number, swapFee: number, swapPublicationDeadline: number, destAddress: string) { };
  getLoopOutTerms() { };
  getLoopOutQuote(amount: number, targetConf: number, swapPublicationDeadline: number) { };
  getLoopOutTermsAndQuotes(targetConf: number) { };
  loopIn(amount: number, swapFee: number, minerFee: number, lastHop: string, externalHtlc: boolean) { };
  getLoopInTerms() { };
  getLoopInQuote(amount: number, targetConf: string, swapPublicationDeadline: number) { };
  getLoopInTermsAndQuotes(targetConf: number) { };
  getSwap(id: string) { };
  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) { };
  handleErrorWithAlert(errURL: string, err: any) { };

}

export class mockBoltzService {

  public swapsChanged = new BehaviorSubject<any[]>([]);
  getSwapsList() { };
  listSwaps() { };
  swapInfo(id: string) { };
  serviceInfo() { };
  swapOut(amount: number, address: string) { };
  swapIn(amount: number) { };
  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) { };
  handleErrorWithAlert(errURL: string, err: any) { };

}

export class mockRTLEffects {

  closeAllDialogs = of(() => ({}));
  openSnackBar = of(() => ({}));
  openSpinner = of(() => ({}));
  closeSpinner = of(() => ({}));
  openAlert = of(() => ({}));
  closeAlert = of(() => ({}));
  openConfirm = of(() => ({}));
  closeConfirm = of(() => ({}));
  showNodePubkey = of(() => ({}));
  appConfigFetch = of(() => ({}));
  settingSave = of(() => ({}));
  updateServicesettings = of(() => ({}));
  ssoSave = of(() => ({}));
  twoFASettingSave = of(() => ({}));
  configFetch = of(() => ({}));
  showLnConfig = of(() => ({}));
  isAuthorized = of(() => ({}));
  isAuthorizedRes = of(() => ({}));
  authLogin = of(() => ({}));
  tokenVerify = of(() => ({}));
  logOut = of(() => ({}));
  resetPassword = of(() => ({}));
  setSelectedNode = of(() => ({}));
  fetchFile = of(() => ({}));
  showFile = of(() => ({}));
  initializeNode = of(() => ({}));
  SetToken = of(() => ({}));
  setLoggedInDetails = of(() => ({}));
  handleErrorWithoutAlert = of(() => ({}));
  handleErrorWithAlert = of(() => ({}));

};

export class mockLNDEffects {

  infoFetch = of(() => ({}));
  fetchFees = of(() => ({}));
  fetchFeeRates = of(() => ({}));
  fetchBalance = of(() => ({}));
  fetchLocalRemoteBalance = of(() => ({}));
  getNewAddress = of(() => ({}));
  setNewAddress = of(() => ({}));
  peersFetch = of(() => ({}));
  saveNewPeer = of(() => ({}));
  detachPeer = of(() => ({}));
  channelsFetch = of(() => ({}));
  openNewChannel = of(() => ({}));
  updateChannel = of(() => ({}));
  closeChannel = of(() => ({}));
  paymentsFetch = of(() => ({}));
  decodePayment = of(() => ({}));
  setDecodedPayment = of(() => ({}));
  sendPayment = of(() => ({}));
  queryRoutesFetch = of(() => ({}));
  setQueryRoutes = of(() => ({ type: 'SET_QUERY_ROUTES', payload: { routes: [] } }));
  peerLookup = of(() => ({}));
  channelLookup = of(() => ({}));
  invoiceLookup = of(() => ({}));
  setLookup = of(() => ({}));
  fetchForwardingHistory = of(() => ({}));
  deleteExpiredInvoice = of(() => ({}));
  saveNewInvoice = of(() => ({}));
  invoicesFetch = of(() => ({}));
  SetChannelTransaction = of(() => ({}));
  utxosFetch = of(() => ({}));
  initWalletRes = of(() => ({}));
  initWallet = of(() => ({}));
  genSeedResponse = of(() => ({}));
  setRestoreChannelList = of({ files: [], all_restore_exists: true });

}

export class mockCLEffects {

  infoFetchCL = of(() => ({}));
  fetchFeesCL = of(() => ({}));
  fetchFeeRatesCL = of(() => ({}));
  fetchBalancCL = of(() => ({}));
  fetchLocalRemoteBalancCL = of(() => ({}));
  getNewAddressCL = of(() => ({}));
  setNewAddressCL = of(() => ({}));
  peersFetchCL = of(() => ({}));
  saveNewPeerCL = of(() => ({}));
  detachPeerCL = of(() => ({}));
  channelsFetchCL = of(() => ({}));
  openNewChannelCL = of(() => ({}));
  updateChannelCL = of(() => ({}));
  closeChannelCL = of(() => ({}));
  paymentsFetchCL = of(() => ({}));
  decodePaymentCL = of(() => ({}));
  setDecodedPaymentCL = of(() => ({}));
  sendPaymentCL = of(() => ({}));
  queryRoutesFetchCL = of(() => ({}));
  peerLookupCL = of(() => ({}));
  channelLookupCL = of(() => ({}));
  invoiceLookupCL = of(() => ({}));
  setLookupCL = of(() => ({}));
  fetchForwardingHistoryCL = of(() => ({}));
  deleteExpiredInvoiceCL = of(() => ({}));
  saveNewInvoiceCL = of(() => ({}));
  invoicesFetchCL = of(() => ({}));
  SetChannelTransactionCL = of(() => ({}));
  utxosFetchCL = of(() => ({}));
  setQueryRoutesCL = of(() => ({ type: CLNActions.SET_QUERY_ROUTES_CLN, payload: { routes: [] } }));

}

export class mockECLEffects {

  infoFetch = of(() => ({}));
  fetchFees = of(() => ({}));
  fetchFeeRates = of(() => ({}));
  fetchBalance = of(() => ({}));
  fetchLocalRemoteBalance = of(() => ({}));
  getNewAddress = of(() => ({}));
  setNewAddress = of(() => ({}));
  peersFetch = of(() => ({}));
  saveNewPeer = of(() => ({}));
  detachPeer = of(() => ({}));
  channelsFetch = of(() => ({}));
  openNewChannel = of(() => ({}));
  updateChannel = of(() => ({}));
  closeChannel = of(() => ({}));
  paymentsFetch = of(() => ({}));
  decodePayment = of(() => ({}));
  setDecodedPayment = of(() => ({}));
  sendPayment = of(() => ({}));
  queryRoutesFetch = of(() => ({}));
  setQueryRoutes = of([]);
  peerLookup = of(() => ({}));
  channelLookup = of(() => ({}));
  invoiceLookup = of(() => ({}));
  setLookup = of(() => ({}));
  fetchForwardingHistory = of(() => ({}));
  deleteExpiredInvoice = of(() => ({}));
  saveNewInvoice = of(() => ({}));
  invoicesFetch = of(() => ({}));
  SetChannelTransaction = of(() => ({}));
  utxosFetch = of(() => ({}));

}
