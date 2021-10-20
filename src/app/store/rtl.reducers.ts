import { createFeatureSelector, createSelector } from '@ngrx/store';

import { ApiCallsListRoot } from '../shared/models/apiCallsPayload';
import { APICallStatusEnum } from '../shared/services/consts-enums-functions';
import { RTLConfiguration, ConfigSettingsNode, GetInfoRoot } from '../shared/models/RTLconfig';

import * as fromECL from '../eclair/store/ecl.reducers';
import * as fromCL from '../clightning/store/cl.reducers';
import * as fromLND from '../lnd/store/lnd.reducers';
import * as RTLActions from './rtl.actions';

export interface RootState {
  apiURL: string;
  apisCallStatus: ApiCallsListRoot;
  selNode: ConfigSettingsNode;
  appConfig: RTLConfiguration;
  nodeData: GetInfoRoot;
}

const initNodeSettings = { userPersona: 'OPERATOR', themeMode: 'DAY', themeColor: 'PURPLE', channelBackupPath: '', selCurrencyUnit: 'USD', fiatConversion: false, currencyUnits: ['Sats', 'BTC', 'USD'], bitcoindConfigPath: '' };
const initNodeAuthentication = { configPath: '', swapMacaroonPath: '', boltzMacaroonPath: '' };

export const initRootState: RootState = {
  apiURL: '',
  apisCallStatus: { Login: { status: APICallStatusEnum.UN_INITIATED }, IsAuthorized: { status: APICallStatusEnum.UN_INITIATED } },
  selNode: { settings: initNodeSettings, authentication: initNodeAuthentication, lnImplementation: 'LND' },
  appConfig: {
    defaultNodeIndex: -1,
    selectedNodeIndex: -1,
    sso: { rtlSSO: 0, logoutRedirectLink: '' },
    enable2FA: false,
    nodes: [{ settings: initNodeSettings, authentication: initNodeAuthentication }]
  },
  nodeData: {}
};

export function RootReducer(state = initRootState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.UPDATE_API_CALL_STATUS_ROOT:
      const updatedApisCallStatus = state.apisCallStatus;
      updatedApisCallStatus[action.payload.action] = {
        status: action.payload.status,
        statusCode: action.payload.statusCode,
        message: action.payload.message,
        URL: action.payload.URL,
        filePath: action.payload.filePath
      };
      return {
        ...state,
        apisCallStatus: updatedApisCallStatus
      };
    case RTLActions.RESET_ROOT_STORE:
      return {
        ...initRootState,
        appConfig: state.appConfig,
        selNode: action.payload
      };
    case RTLActions.SET_SELECTED_NODE:
      return {
        ...state,
        selNode: action.payload.lnNode
      };
    case RTLActions.SET_NODE_DATA:
      return {
        ...state,
        nodeData: action.payload
      };
    case RTLActions.SET_RTL_CONFIG:
      return {
        ...state,
        appConfig: action.payload
      };
    default:
      return state;
  }
}

export interface RTLState {
  root: RootState;
  lnd: fromLND.LNDState;
  cl: fromCL.CLState;
  ecl: fromECL.ECLState;
}

export const RTLReducer = {
  root: RootReducer,
  lnd: fromLND.LNDReducer,
  cl: fromCL.CLReducer,
  ecl: fromECL.ECLReducer
};

export const getRTLState = createFeatureSelector<RTLState>('rtl');
export const getApiUrl = createSelector(getRTLState, (state: RTLState) => state.root.apiURL);
