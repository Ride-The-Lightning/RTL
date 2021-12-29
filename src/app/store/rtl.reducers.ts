import { createReducer, on } from '@ngrx/store';
import { initRootState } from './rtl.state';

import { resetRootStore, setNodeData, setRTLConfig, setSelectedNode, updateRootAPICallStatus, updateRootNodeSettings } from './rtl.actions';
import { ServicesEnum } from '../shared/services/consts-enums-functions';
import { ConfigSettingsNode } from '../shared/models/RTLconfig';

export const RootReducer = createReducer(initRootState,
  on(updateRootAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = JSON.parse(JSON.stringify(state.apisCallStatus));
    updatedApisCallStatus[payload.action] = {
      status: payload.status,
      statusCode: payload.statusCode,
      message: payload.message,
      URL: payload.URL,
      filePath: payload.filePath
    };
    return {
      ...state,
      apisCallStatus: updatedApisCallStatus
    };
  }),
  on(resetRootStore, (state, { payload }) => ({
    ...initRootState,
    apisCallStatus: state.apisCallStatus,
    appConfig: state.appConfig,
    selNode: payload
  })),
  on(setSelectedNode, (state, { payload }) => ({
    ...state,
    selNode: payload.currentLnNode
  })),
  on(updateRootNodeSettings, (state, { payload }) => {
    const updatedSelNode: ConfigSettingsNode = JSON.parse(JSON.stringify(state.selNode));
    switch (payload.service) {
      case ServicesEnum.BOLTZ:
        updatedSelNode.settings.boltzServerUrl = payload.settings.boltzServerUrl;
        break;
      case ServicesEnum.LOOP:
        updatedSelNode.settings.swapServerUrl = payload.settings.swapServerUrl;
        break;
      case ServicesEnum.OFFERS:
        updatedSelNode.settings.enableOffers = payload.settings.enableOffers;
        break;

      default:
        break;
    }
    return {
      ...state,
      selNode: updatedSelNode
    };
  }),
  on(setNodeData, (state, { payload }) => ({
    ...state,
    nodeData: payload
  })),
  on(setRTLConfig, (state, { payload }) => ({
    ...state,
    appConfig: payload
  }))
);
