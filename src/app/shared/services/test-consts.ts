import { BehaviorSubject, of } from 'rxjs';
import * as CLActions from '../../clightning/store/cl.actions';

export class mockMatDialogRef {
  close = (dialogResult: any) => {};
}

export class mockDataService {
  getChildAPIUrl(){};
  getLnImplementation(){};
  setChildAPIUrl(lnImplementation: string) {};
  getFiatRates() {
    return of({"USD":{"15m":33438.82,"last":33438.82,"buy":33438.82,"sell":33438.82,"symbol":"USD"},"EUR":{"15m":28193.8,"last":28193.8,"buy":28193.8,"sell":28193.8,"symbol":"EUR"},"GBP":{"15m":23987.68,"last":23987.68,"buy":23987.68,"sell":23987.68,"symbol":"GBP"},"AUD":{"15m":44548.88,"last":44548.88,"buy":44548.88,"sell":44548.88,"symbol":"AUD"},"BRL":{"15m":170094.31,"last":170094.31,"buy":170094.31,"sell":170094.31,"symbol":"BRL"},"CAD":{"15m":41287.51,"last":41287.51,"buy":41287.51,"sell":41287.51,"symbol":"CAD"},"TRY":{"15m":291352.46,"last":291352.46,"buy":291352.46,"sell":291352.46,"symbol":"TRY"},"CLP":{"15m":24845458.07,"last":24845458.07,"buy":24845458.07,"sell":24845458.07,"symbol":"CLP"},"ISK":{"15m":4508648.05,"last":4508648.05,"buy":4508648.05,"sell":4508648.05,"symbol":"ISK"},"JPY":{"15m":3715369.25,"last":3715369.25,"buy":3715369.25,"sell":3715369.25,"symbol":"JPY"},"KRW":{"15m":39148401.79,"last":39148401.79,"buy":39148401.79,"sell":39148401.79,"symbol":"KRW"},"CHF":{"15m":30889.26,"last":30889.26,"buy":30889.26,"sell":30889.26,"symbol":"CHF"},"CNY":{"15m":216826.46,"last":216826.46,"buy":216826.46,"sell":216826.46,"symbol":"CNY"},"CZK":{"15m":724605.76,"last":724605.76,"buy":724605.76,"sell":724605.76,"symbol":"CZK"},"DKK":{"15m":245951.1,"last":245951.1,"buy":245951.1,"sell":245951.1,"symbol":"DKK"},"HKD":{"15m":260276.41,"last":260276.41,"buy":260276.41,"sell":260276.41,"symbol":"HKD"},"HUF":{"15m":11866363.6,"last":11866363.6,"buy":11866363.6,"sell":11866363.6,"symbol":"HUF"},"HRK":{"15m":584240.71,"last":584240.71,"buy":584240.71,"sell":584240.71,"symbol":"HRK"},"INR":{"15m":2687019.47,"last":2687019.47,"buy":2687019.47,"sell":2687019.47,"symbol":"INR"},"NZD":{"15m":47535.46,"last":47535.46,"buy":47535.46,"sell":47535.46,"symbol":"NZD"},"PLN":{"15m":127106.86,"last":127106.86,"buy":127106.86,"sell":127106.86,"symbol":"PLN"},"RON":{"15m":128655.22,"last":128655.22,"buy":128655.22,"sell":128655.22,"symbol":"RON"},"RUB":{"15m":2450480.5,"last":2450480.5,"buy":2450480.5,"sell":2450480.5,"symbol":"RUB"},"SEK":{"15m":285404.7,"last":285404.7,"buy":285404.7,"sell":285404.7,"symbol":"SEK"},"SGD":{"15m":45233.21,"last":45233.21,"buy":45233.21,"sell":45233.21,"symbol":"SGD"},"THB":{"15m":1074389.36,"last":1074389.36,"buy":1074389.36,"sell":1074389.36,"symbol":"THB"},"TWD":{"15m":1092607.79,"last":1092607.79,"buy":1092607.79,"sell":1092607.79,"symbol":"TWD"}});
  }
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
