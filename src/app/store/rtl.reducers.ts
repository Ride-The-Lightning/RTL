import { ActionReducerMap } from '@ngrx/store';
import { ErrorPayload } from '../shared/models/errorPayload';
import { RTLConfiguration, LightningNode, GetInfoRoot } from '../shared/models/RTLconfig';

import * as fromCL from '../clightning/store/cl.reducers';
import * as fromLND from '../lnd/store/lnd.reducers';
import * as RTLActions from './rtl.actions';

export interface RootState {
  effectErrorsRoot: ErrorPayload[];
  selNode: LightningNode;
  appConfig: RTLConfiguration;
  nodeData: GetInfoRoot
}

const initNodeSettings = { flgSidenavOpened: true, flgSidenavPinned: true, menu: 'Vertical', menuType: 'Regular', theme: 'dark-blue', satsToBTC: false };
const initNodeAuthentication = { nodeAuthType: 'CUSTOM', lndConfigPath: '', bitcoindConfigPath: '' };

const initRootState: RootState = {
  effectErrorsRoot: [],
  selNode: {settings: initNodeSettings, authentication: initNodeAuthentication},
  appConfig: {
    selectedNodeIndex: -1,
    sso: { rtlSSO: 0, logoutRedirectLink: '/login' },
    nodes: [{ settings: initNodeSettings, authentication: initNodeAuthentication}]
  },
  nodeData: { identity_pubkey: 'abc', alias: 'xyz', testnet: true, chains: [{chain: "bitcoin", network: "testnet"}], version: 'v0', currency_unit: 'BTC', smaller_currency_unit: 'SATS', numberOfPendingChannels: -1 }
};

export function RootReducer(state = initRootState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR_ROOT:
      const clearedEffectErrors = [...state.effectErrorsRoot];
      const removeEffectIdx = state.effectErrorsRoot.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrors: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR_ROOT:
      return {
        ...state,
        effectErrors: [...state.effectErrorsRoot, action.payload]
      };
    case RTLActions.RESET_ROOT_STORE:
      return {
        ...initRootState,
        appConfig: state.appConfig,
        selNode: action.payload,
      };
    case RTLActions.SET_SELECTED_NODE:
      return {
        ...state,
        selNode: action.payload
      };
    case RTLActions.SET_RTL_CONFIG:
      return {
        ...state,
        selNode: action.payload.nodes.find(node => +node.index === action.payload.selectedNodeIndex),
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
}

export const RTLReducer: ActionReducerMap<RTLState> = {
  root: RootReducer,
  lnd: fromLND.LNDReducer,
  cl: fromCL.CLReducer
};
