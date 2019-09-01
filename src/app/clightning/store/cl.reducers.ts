import { GetInfoCL, FeesCL } from '../../shared/models/clModels';
import * as RTLActions from '../../store/rtl.actions';

export interface CLState {
  information: GetInfoCL;
  fees: FeesCL;
}

export const initCLState: CLState = {
  information: {},
  fees: {}
}

export function CLReducer(state = initCLState, action: RTLActions.RTLActions) {
  switch (action.type) {
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
    default:
      return state;
  }

}
