import { createReducer, on } from '@ngrx/store';
import { initRootState } from './rtl.state';

import { resetRootStore, setNodeData, setRTLConfig, setSelectedNode, updateRootAPICallStatus } from './rtl.actions';

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
    selNode: payload.lnNode
  })),
  on(setNodeData, (state, { payload }) => ({
    ...state,
    nodeData: payload
  })),
  on(setRTLConfig, (state, { payload }) => ({
    ...state,
    appConfig: payload
  }))
);
