import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfoCL, FeesCL, BalanceCL, LocalRemoteBalanceCL } from '../../shared/models/clModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import * as RTLActions from '../../store/rtl.actions';

export interface CLState {
  effectErrorsCl: ErrorPayload[];
  nodeSettings: SelNodeChild;
  information: GetInfoCL;
  fees: FeesCL;
  balance: BalanceCL;
  localRemoteBalance: LocalRemoteBalanceCL;
}

export const initCLState: CLState = {
  effectErrorsCl: [],
  nodeSettings: { channelBackupPath: '', satsToBTC: false },
  information: {},
  fees: {},
  balance: {},
  localRemoteBalance: {}
}

export function CLReducer(state = initCLState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR_CL:
      const clearedEffectErrors = [...state.effectErrorsCl];
      const removeEffectIdx = state.effectErrorsCl.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrors: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR_CL:
      return {
        ...state,
        effectErrors: [...state.effectErrorsCl, action.payload]
      };
    case RTLActions.RESET_CL_STORE:
      return {
        ...initCLState,
        nodeSettings: action.payload,
      };
    case RTLActions.SET_CL_INFO:
      return {
        ...state,
        information: action.payload
      };
    case RTLActions.SET_CL_FEES:
      return {
        ...state,
        fees: action.payload
      };
    case RTLActions.SET_CL_BALANCE:
      return {
        ...state,
        balance: action.payload
      };
    case RTLActions.SET_CL_LOCAL_REMOTE_BALANCE:
      return {
        ...state,
        localRemoteBalance: action.payload
      };
    default:
      return state;
  }

}
