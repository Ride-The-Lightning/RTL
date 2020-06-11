import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfoECLR } from '../../shared/models/eclrModels';
// import { GetInfoECLR, FeesCL, BalanceCL, LocalRemoteBalanceCL, PeerCL, PaymentCL, ChannelCL, FeeRatesCL, ForwardingHistoryResCL, ListInvoicesCL } from '../../shared/models/clModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import * as RTLActions from '../../store/rtl.actions';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';

export interface ECLRState {
  effectErrorsEclr: ErrorPayload[];
  nodeSettings: SelNodeChild;
  information: GetInfoECLR;
}

export const initECLRState: ECLRState = {
  effectErrorsEclr: [],
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  information: {},
}

export function ECLRReducer(state = initECLRState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR_ECLR:
      const clearedEffectErrors = [...state.effectErrorsEclr];
      const removeEffectIdx = state.effectErrorsEclr.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrorsCl: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR_ECLR:
      return {
        ...state,
        effectErrorsCl: [...state.effectErrorsEclr, action.payload]
      };
    case RTLActions.SET_CHILD_NODE_SETTINGS_ECLR:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case RTLActions.RESET_ECLR_STORE:
      return {
        ...initECLRState,
        nodeSettings: action.payload,
      };
    case RTLActions.SET_INFO_ECLR:
      return {
        ...state,
        information: action.payload
      };
    default:
      return state;
  }

}
