import { createReducer, on } from '@ngrx/store';
import { initRootState } from './rtl.state';

import { resetRootStore, setNodeData, setRTLConfig, setSelectedNode, updateAPICallStatus } from './rtl.actions';

export const RootReducer = createReducer(initRootState,
  on(updateAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = state.apisCallStatus;
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
