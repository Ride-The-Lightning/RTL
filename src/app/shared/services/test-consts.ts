import { of } from 'rxjs';
export const mockRTLEffects = jasmine.createSpyObj("RTLEffects", ["closeAllDialogs", "openSnackBar", "openSpinner", "closeSpinner", "openAlert", "closeAlert", "openConfirm", "closeConfirm", "showNodePubkey", "appConfigFetch", "settingSave", "updateServicesettings", "ssoSave", "twoFASettingSave", "configFetch", "showLnConfig", "isAuthorized", "isAuthorizedRes", "authLogin", "tokenVerify", "logOut", "resetPassword", "setSelectedNode", "fetchFile", "showFile", "initializeNode", "SetToken", "setLoggedInDetails", "handleErrorWithoutAlert", "handleErrorWithAlert", "ngOnDestroy"]);
export const mockLNDEffects = jasmine.createSpyObj("LNDEffects", ["infoFetch", "fetchFees", "fetchFeeRates", "fetchBalance", "fetchLocalRemoteBalance", "getNewAddress", "setNewAddress", "peersFetch", "saveNewPeer", "detachPeer", "channelsFetch", "openNewChannel", "updateChannel", "closeChannel", "paymentsFetch", "decodePayment", "setDecodedPayment", "sendPayment", "queryRoutesFetch", "setQueryRoutes", "peerLookup", "channelLookup", "invoiceLookup", "setLookup", "fetchForwardingHistory", "deleteExpiredInvoice", "saveNewInvoice", "invoicesFetch", "SetChannelTransaction", "utxosFetch", "initializeRemainingData", "handleErrorWithoutAlert", "handleErrorWithAlert", "ngOnDestroy"]);
export const mockECLEffects = jasmine.createSpyObj("ECLEffects", ["infoFetchECL", "fetchFeesECL", "fetchFeeRatesECL", "fetchBalanceECL", "fetchLocalRemoteBalanceECL", "getNewAddressECL", "setNewAddressECL", "peersFetchECL", "saveNewPeerECL", "detachPeerECL", "channelsFetchECL", "openNewChannelECL", "updateChannelECL", "closeChannelECL", "paymentsFetchECL", "decodePaymentECL", "setDecodedPaymentECL", "sendPaymentECL", "queryRoutesFetchECL", "setQueryRoutesECL", "peerLookupECL", "channelLookupECL", "invoiceLookupECL", "setLookupECL", "fetchForwardingHistoryECL", "deleteExpiredInvoiceECL", "saveNewInvoiceECL", "invoicesFetchECL", "SetChannelTransactionECL", "utxosFetch", "initializeRemainingData", "handleErrorWithoutAlert", "handleErrorWithAlert", "ngOnDestroy"]);

export class mockMatDialogRef {
  close = (dialogResult: any) => {};
}

export class mockCommonService {
  getScreenSize = () => {
    return of({width: 1200, height: 900});
  }; 
  setScreenSize = () => {};
  getContainerSize = () => { return of({width: 1000, height: 800}); };
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

export class mockCLEffects {
  infoFetchCL() {};
  fetchFeesCL() {};
  fetchFeeRatesCL() {};
  fetchBalanceCL() {};
  fetchLocalRemoteBalanceCL() {};
  getNewAddressCL() {};
  setNewAddressCL() {};
  peersFetchCL() {};
  saveNewPeerCL() {};
  detachPeerCL() {};
  channelsFetchCL() {};
  openNewChannelCL() {};
  updateChannelCL() {};
  closeChannelCL() {};
  paymentsFetchCL() {};
  decodePaymentCL() {};
  setDecodedPaymentCL() {};
  sendPaymentCL() {};
  queryRoutesFetchCL() {};
  setQueryRoutesCL = () => {return of({});};
  peerLookupCL() {};
  channelLookupCL() {};
  invoiceLookupCL() {};
  setLookupCL() {};
  fetchForwardingHistoryCL() {};
  deleteExpiredInvoiceCL() {};
  saveNewInvoiceCL() {};
  invoicesFetchCL() {};
  SetChannelTransactionCL() {};
  utxosFetch() {};
  initializeRemainingData(info: any, landingPage: string) {};
  handleErrorWithoutAlert(actionName: string, genericErrorMessage: string, err: { status: number, error: any }) {};
  handleErrorWithAlert(alerType: string, alertTitle: string, errURL: string, err: { status: number, error: any }) {};
}
