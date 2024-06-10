import { createReducer, on } from '@ngrx/store';
import { initRootState } from './rtl.state';

import { resetRootStore, setNodeData, setApplicationSettings, setSelectedNodeSettings, updateRootAPICallStatus } from './rtl.actions';

export const RootReducer = createReducer(initRootState,
  on(updateRootAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = JSON.parse(JSON.stringify(state.apisCallStatus));
    if (payload.action) {
      updatedApisCallStatus[payload.action] = {
        status: payload.status,
        statusCode: payload.statusCode,
        message: payload.message,
        URL: payload.URL,
        filePath: payload.filePath
      };
    }
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
  on(setSelectedNodeSettings, (state, { payload }) => ({
    ...state,
    selNode: payload
  })),
  on(setNodeData, (state, { payload }) => ({
    ...state,
    nodeData: payload
  })),
  on(setApplicationSettings, (state, { payload }) => ({
    ...state,
    appConfig: payload
  }))
);
