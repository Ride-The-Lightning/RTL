import { BehaviorSubject, of } from 'rxjs';
import * as CLActions from '../../clightning/store/cl.actions';

export class mockMatDialogRef {
  close = (dialogResult: any) => {};
}

export class mockCommonService {
  getScreenSize = () => ({width: 1200, height: 900});
  setScreenSize = () => {};
  getContainerSize = () => ({width: 1000, height: 800});
  setContainerSize = () => {}; 
  sortByKey = () => {};
  sortDescByKey = () => {}; 
  sortAscByKey = () => {}; 
  camelCase = () => {}; 
  titleCase = () => {}; 
  convertCurrency = () => {}; 
  convertWithoutFiat = () => {}; 
  convertWithFiat = () => {}; 
  convertTime = () => {}; 
  downloadFile = () => {}; 
  convertToCSV = () => {};
  isVersionCompatible = () => {}; 
}

export class mockDataService {
  getChildAPIUrl(){};
  getLnImplementation(){};
  setChildAPIUrl(lnImplementation: string) {};
  getFiatRates() {};
  decodePayment(payment: string, fromDialog: boolean) {};
  decodePayments(payments: string) {};
  getAliasesFromPubkeys(pubkey: string, multiple: boolean) {};
  signMessage(msg: string) {};
  verifyMessage(msg: string, sign: string) {};
  bumpFee(txid: string, outputIndex: number, targetConf: number, satPerByte: number) {};
  labelUTXO(txid: string, label: string, overwrite: boolean = true) {};
  leaseUTXO(txid: string, output_index: number) {};
  getForwardingHistory(start: string, end: string) {};
  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {};
  handleErrorWithAlert(alertType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {};
};

export class mockLoopService {
  public swapsChanged = new BehaviorSubject<any[]>([]);
  getSwapsList() {};
  listSwaps() {};
  loopOut(amount: number, chanId: string, targetConf: number, swapRoutingFee: number, minerFee: number, prepayRoutingFee: number, prepayAmt: number, swapFee: number, swapPublicationDeadline: number, destAddress: string) {};
  getLoopOutTerms() {};
  getLoopOutQuote(amount: number, targetConf: number, swapPublicationDeadline: number) {};
  getLoopOutTermsAndQuotes(targetConf: number) {};
  loopIn(amount: number, swapFee: number, minerFee: number, lastHop: string, externalHtlc: boolean) {};
  getLoopInTerms() {};
  getLoopInQuote(amount: number, targetConf: string, swapPublicationDeadline: number) {};
  getLoopInTermsAndQuotes(targetConf: number) {};
  getSwap(id: string) {};
  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {};
  handleErrorWithAlert(errURL: string, err: any) {};
}

export class mockBoltzService {
  public swapsChanged = new BehaviorSubject<any[]>([]);
  getSwapsList() {};
  listSwaps() {};
  swapInfo(id: string) {};
  serviceInfo() {};
  swapOut(amount: number, address: string) {};
  swapIn(amount: number) {};
  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {};
  handleErrorWithAlert(errURL: string, err: any) {};
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
  setQueryRoutes = of(() => ({ type: 'SET_QUERY_ROUTES', payload: {routes: []}}));
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
  setRestoreChannelList = of(() => ({}));
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
  setQueryRoutesCL = of(() => ({type: CLActions.SET_QUERY_ROUTES_CL, payload: {routes: []}}))
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
  setQueryRoutes = of(() => ({ type: 'SET_QUERY_ROUTES_ECL', payload: []}))
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
