import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees } from '../../shared/models/eclrModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import * as ECLRActions from './eclr.actions';
import * as RTLActions from '../../store/rtl.actions';

export interface ECLRState {
  effectErrors: ErrorPayload[];
  nodeSettings: SelNodeChild;
  information: GetInfo;
  fees: Fees;
  channels: Channel[];
  channelStats: ChannelStats;
}

export const initECLRState: ECLRState = {
  effectErrors: [],
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  information: {},
  fees: {},
  channels: [],
  channelStats: {}
}

export function ECLRReducer(state = initECLRState, action: ECLRActions.ECLRActions) {
  switch (action.type) {
    case ECLRActions.CLEAR_EFFECT_ERROR:
      const clearedEffectErrors = [...state.effectErrors];
      const removeEffectIdx = state.effectErrors.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrorsCl: clearedEffectErrors
      };
    case ECLRActions.EFFECT_ERROR:
      return {
        ...state,
        effectErrorsCl: [...state.effectErrors, action.payload]
      };
    case ECLRActions.SET_CHILD_NODE_SETTINGS:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case ECLRActions.RESET_ECLR_STORE:
      return {
        ...initECLRState,
        nodeSettings: action.payload,
      };
    case ECLRActions.SET_INFO:
      return {
        ...state,
        information: action.payload
      };
    case ECLRActions.SET_FEES:
      return {
        ...state,
        fees: action.payload
      };
    case ECLRActions.SET_CHANNELS:
      return {
        ...state,
        channels: action.payload,
      };
    case ECLRActions.SET_CHANNEL_STATS:
      return {
        ...state,
        channelStats: action.payload,
      };
    default:
      return state;
  }

}
