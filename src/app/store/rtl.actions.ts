import { createAction, props } from '@ngrx/store';

import { DialogConfig } from '../shared/models/alertData';
import { ApiCallStatusPayload } from '../shared/models/apiCallsPayload';
import { RTLConfiguration, Settings, ConfigSettingsNode, GetInfoRoot, SSO } from '../shared/models/RTLconfig';
import { ServicesEnum } from '../shared/services/consts-enums-functions';

export const VOID = 'VOID';
export const SET_API_URL_ECL = 'SET_API_URL_ECL';
export const UPDATE_SELECTED_NODE_OPTIONS = 'UPDATE_SELECTED_NODE_OPTIONS';
export const UPDATE_API_CALL_STATUS_ROOT = 'UPDATE_API_CALL_STATUS_ROOT';
export const RESET_ROOT_STORE = 'RESET_ROOT_STORE';
export const CLOSE_ALL_DIALOGS = 'CLOSE_ALL_DIALOGS';
export const OPEN_SNACK_BAR = 'OPEN_SNACKBAR';
export const OPEN_SPINNER = 'OPEN_SPINNER';
export const CLOSE_SPINNER = 'CLOSE_SPINNER';
export const OPEN_ALERT = 'OPEN_ALERT';
export const CLOSE_ALERT = 'CLOSE_ALERT';
export const OPEN_CONFIRMATION = 'OPEN_CONFIRMATION';
export const CLOSE_CONFIRMATION = 'CLOSE_CONFIRMATION';
export const SHOW_PUBKEY = 'SHOW_PUBKEY';
export const FETCH_CONFIG = 'FETCH_CONFIG';
export const SHOW_CONFIG = 'SHOW_CONFIG';
export const FETCH_STORE = 'FETCH_STORE';
export const SET_STORE = 'SET_STORE';
export const FETCH_RTL_CONFIG = 'FETCH_RTL_CONFIG';
export const SET_RTL_CONFIG = 'SET_RTL_CONFIG';
export const SAVE_SSO = 'SAVE_SSO';
export const SAVE_SETTINGS = 'SAVE_SETTINGS';
export const TWO_FA_SAVE_SETTINGS = 'TWO_FA_SAVE_SETTINGS';
export const SET_SELECTED_NODE = 'SET_SELECTED_NODE';
export const UPDATE_SERVICE_SETTINGS = 'UPDATE_SERVICE_SETTINGS';
export const SET_NODE_DATA = 'SET_NODE_DATA';
export const IS_AUTHORIZED = 'IS_AUTHORIZED';
export const IS_AUTHORIZED_RES = 'IS_AUTHORIZED_RES';
export const LOGIN = 'LOGIN';
export const VERIFY_TWO_FA = 'VERIFY_TWO_FA';
export const LOGOUT = 'LOGOUT';
export const RESET_PASSWORD = 'RESET_PASSWORD';
export const RESET_PASSWORD_RES = 'RESET_PASSWORD_RES';
export const FETCH_FILE = 'FETCH_FILE';
export const SHOW_FILE = 'SHOW_FILE';


export const voidAction = createAction(VOID);

export const setApiUrl = createAction(SET_API_URL_ECL, props<{ payload: string }>());

export const updateAPICallStatus = createAction(UPDATE_API_CALL_STATUS_ROOT, props<{ payload: ApiCallStatusPayload }>());

export const closeAllDialogs = createAction(CLOSE_ALL_DIALOGS);

export const openSnackBar = createAction(OPEN_SNACK_BAR, props<{ payload: string | { message: string, duration?: number, type?: string } }>());

export const openSpinner = createAction(OPEN_SPINNER, props<{ payload: string }>());

export const closeSpinner = createAction(CLOSE_SPINNER, props<{ payload: string }>());

export const openAlert = createAction(OPEN_ALERT, props<{ payload: DialogConfig }>());

export const closeAlert = createAction(CLOSE_ALERT, props<{ payload: any }>());

export const openConfirmation = createAction(OPEN_CONFIRMATION, props<{ payload: DialogConfig }>());

export const closeConfirmation = createAction(CLOSE_CONFIRMATION, props<{ payload: boolean }>());

export const showPubkey = createAction(SHOW_PUBKEY);

export const fetchConfig = createAction(FETCH_CONFIG, props<{ payload: string }>());

export const showConfig = createAction(SHOW_CONFIG, props<{ payload: any }>());

export const updateSelectedNodeOptions = createAction(UPDATE_SELECTED_NODE_OPTIONS);

export const resetRootStore = createAction(RESET_ROOT_STORE, props<{ payload: ConfigSettingsNode }>());

export const fetchRTLConfig = createAction(FETCH_RTL_CONFIG);

export const setRTLConfig = createAction(SET_RTL_CONFIG, props<{ payload: RTLConfiguration }>());

export const saveSettings = createAction(SAVE_SETTINGS, props<{ payload: { uiMessage: string, settings?: Settings, defaultNodeIndex?: number } }>());

export const twoFASaveSettings = createAction(TWO_FA_SAVE_SETTINGS, props<{ payload: { secret2fa: string } }>());

export const setSelelectedNode = createAction(SET_SELECTED_NODE, props<{ payload: { uiMessage: string, lnNode: ConfigSettingsNode, isInitialSetup: boolean } }>());

export const updateServiceSettings = createAction(UPDATE_SERVICE_SETTINGS, props<{ payload: { uiMessage: string, service: ServicesEnum, settings: any } }>());

export const setNodeData = createAction(SET_NODE_DATA, props<{ payload: GetInfoRoot }>());

export const saveSSO = createAction(SAVE_SSO, props<{ payload: SSO }>());

export const logout = createAction(LOGOUT);

export const resetPassword = createAction(RESET_PASSWORD, props<{ payload: { currPassword: string, newPassword: string } }>());

export const resetPasswordRes = createAction(RESET_PASSWORD_RES, props<{ payload: { token: string } }>());

export const isAuthorized = createAction(IS_AUTHORIZED, props<{ payload: string }>());

export const isAuthorizedRes = createAction(IS_AUTHORIZED_RES, props<{ payload: any }>());

export const login = createAction(LOGIN, props<{ payload: { password: string, defaultPassword: boolean, twoFAToken?: string } }>());

export const verifyTwoFA = createAction(VERIFY_TWO_FA, props<{ payload: { token: string, authResponse: any } }>());

export const fetchFile = createAction(FETCH_FILE, props<{ payload: { channelPoint: string, path?: string } }>());

export const showFile = createAction(SHOW_FILE, props<{ payload: any }>());
