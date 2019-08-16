import * as CLActions from './cl.actions';
import { GetInfo, GetInfoChain } from '../../shared/models/clModels';
import * as fromApp from '../../store/rtl.reducers';

export interface FeatureState extends fromApp.State {
  cl: CLState;
}

export interface CLState {
  information: GetInfo;
}

export const CLInitialState: CLState = {
  information: {}
};

export function CLReducer(state = CLInitialState, action: CLActions.CLActions) {
  switch (action.type) {
    case CLActions.RESET_CL_STORE:
      return {
        ...CLInitialState
      };
    case CLActions.SET_CL_INFO:
      if (undefined !== action.payload.chains) {
        if (typeof action.payload.chains[0] === 'string') {
          action.payload.smaller_currency_unit = (action.payload.chains[0].toString().toLowerCase().indexOf('bitcoin') < 0) ? 'Litoshis' : 'Sats';
          action.payload.currency_unit = (action.payload.chains[0].toString().toLowerCase().indexOf('bitcoin') < 0) ? 'LTC' : 'BTC';
        } else if (typeof action.payload.chains[0] === 'object' && action.payload.chains[0].hasOwnProperty('chain')) {
          const getInfoChain = <GetInfoChain>action.payload.chains[0];
          action.payload.smaller_currency_unit = (getInfoChain.chain.toLowerCase().indexOf('bitcoin') < 0) ? 'Litoshis' : 'Sats';
          action.payload.currency_unit = (getInfoChain.chain.toLowerCase().indexOf('bitcoin') < 0) ? 'LTC' : 'BTC';
        }
        action.payload.version = (undefined === action.payload.version) ? '' : action.payload.version.split(' ')[0];
      } else {
        action.payload.smaller_currency_unit = 'Sats';
        action.payload.currency_unit = 'BTC';
        action.payload.version = (undefined === action.payload.version) ? '' : action.payload.version.split(' ')[0];
      }
      return {
        ...state,
        information: action.payload
      };
    default:
      return state;
  }

}
