import * as RTLActions from './rtl.actions';
import { ErrorPayload } from '../shared/models/errorPayload';
import { RTLConfiguration, Node } from '../shared/models/RTLconfig';
import { LNDReducer, LNDState, LNDInitialState } from '../lnd/store/lnd.reducers';
import { ActionReducerMap } from '@ngrx/store';

import * as fromLNDReducer from '../lnd/store/lnd.reducers';

export interface State {
  effectErrors: ErrorPayload[];
  selNode: Node;
  appConfig: RTLConfiguration;
  lnd: fromLNDReducer.LNDState;
}

const initNodeSettings = { flgSidenavOpened: true, flgSidenavPinned: true, menu: 'Vertical', menuType: 'Regular', theme: 'dark-blue', satsToBTC: false };
const initNodeAuthentication = { nodeAuthType: 'CUSTOM', lndConfigPath: '', bitcoindConfigPath: '' };

const initialState: State = {
  effectErrors: [],
  selNode: {settings: initNodeSettings, authentication: initNodeAuthentication},
  appConfig: {
    selectedNodeIndex: -1,
    sso: { rtlSSO: 0, logoutRedirectLink: '/login' },
    nodes: [{ settings: initNodeSettings, authentication: initNodeAuthentication}]
  },
  lnd: fromLNDReducer.LNDInitialState
};

export function RTLRootReducer(state = initialState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR:
      const clearedEffectErrors = [...state.effectErrors];
      const removeEffectIdx = state.effectErrors.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrors: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR:
      return {
        ...state,
        effectErrors: [...state.effectErrors, action.payload]
      };
    case RTLActions.RESET_STORE:
      return {
        ...initialState,
        appConfig: state.appConfig,
        selNode: action.payload
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
