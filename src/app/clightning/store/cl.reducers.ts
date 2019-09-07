import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfoCL, FeesCL, BalanceCL, LocalRemoteBalanceCL, AddressTypeCL, PeerCL } from '../../shared/models/clModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import * as RTLActions from '../../store/rtl.actions';

export interface CLState {
  effectErrorsCl: ErrorPayload[];
  nodeSettings: SelNodeChild;
  information: GetInfoCL;
  fees: FeesCL;
  balance: BalanceCL;
  localRemoteBalance: LocalRemoteBalanceCL;
  peers: PeerCL[];
  addressTypes: AddressTypeCL[];
}

export const initCLState: CLState = {
  effectErrorsCl: [],
  nodeSettings: { channelBackupPath: '', satsToBTC: false },
  information: {},
  fees: {},
  balance: {},
  localRemoteBalance: {},
  peers: [],
  addressTypes: [
    { addressId: '0', addressTp: 'bech32', addressDetails: 'bech32'},
    { addressId: '1', addressTp: 'p2sh-segwit', addressDetails: 'p2sh-segwit (default)'}
  ]
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
        effectErrorsCl: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR_CL:
      return {
        ...state,
        effectErrorsCl: [...state.effectErrorsCl, action.payload]
      };
    case RTLActions.RESET_STORE_CL:
      return {
        ...initCLState,
        nodeSettings: action.payload,
      };
    case RTLActions.SET_INFO_CL:
      return {
        ...state,
        information: action.payload
      };
    case RTLActions.SET_FEES_CL:
      return {
        ...state,
        fees: action.payload
      };
    case RTLActions.SET_BALANCE_CL:
      return {
        ...state,
        balance: action.payload
      };
    case RTLActions.SET_LOCAL_REMOTE_BALANCE_CL:
      return {
        ...state,
        localRemoteBalance: action.payload
      };
      case RTLActions.SET_PEERS_CL:
        return {
          ...state,
          peers: action.payload
        };
      case RTLActions.ADD_PEER_CL:
        return {
          ...state,
          peers: [...state.peers, action.payload]
        };
      case RTLActions.REMOVE_PEER_CL:
        const modifiedPeers = [...state.peers];
        const removePeerIdx = state.peers.findIndex(peer => {
          return peer.id === action.payload.id;
        });
        if (removePeerIdx > -1) {
          modifiedPeers.splice(removePeerIdx, 1);
        }
        return {
          ...state,
          peers: modifiedPeers
        };
    default:
      return state;
  }

}
