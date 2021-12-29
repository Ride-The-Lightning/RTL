import { createAction, props } from '@ngrx/store';

import { DialogConfig } from '../shared/models/alertData';
import { ApiCallStatusPayload } from '../shared/models/apiCallsPayload';
import { RTLConfiguration, ConfigSettingsNode, GetInfoRoot, SSO } from '../shared/models/RTLconfig';
import { FetchFile, Login, OpenSnackBar, ResetPassword, SaveSettings, SetSelectedNode, UpdateServiceSetting, VerifyTwoFA } from '../shared/models/rtlModels';
import { RTLActions } from '../shared/services/consts-enums-functions';

export const voidAction = createAction(RTLActions.VOID);

export const setApiUrl = createAction(RTLActions.SET_API_URL_ECL, props<{ payload: string }>());

export const updateRootAPICallStatus = createAction(RTLActions.UPDATE_API_CALL_STATUS_ROOT, props<{ payload: ApiCallStatusPayload }>());

export const closeAllDialogs = createAction(RTLActions.CLOSE_ALL_DIALOGS);

export const openSnackBar = createAction(RTLActions.OPEN_SNACK_BAR, props<{ payload: string | OpenSnackBar }>());

export const openSpinner = createAction(RTLActions.OPEN_SPINNER, props<{ payload: string }>());

export const closeSpinner = createAction(RTLActions.CLOSE_SPINNER, props<{ payload: string }>());

export const openAlert = createAction(RTLActions.OPEN_ALERT, props<{ payload: DialogConfig }>());

export const closeAlert = createAction(RTLActions.CLOSE_ALERT, props<{ payload: any }>());

export const openConfirmation = createAction(RTLActions.OPEN_CONFIRMATION, props<{ payload: DialogConfig }>());

export const closeConfirmation = createAction(RTLActions.CLOSE_CONFIRMATION, props<{ payload: boolean }>());

export const showPubkey = createAction(RTLActions.SHOW_PUBKEY);

export const fetchConfig = createAction(RTLActions.FETCH_CONFIG, props<{ payload: string }>());

export const showConfig = createAction(RTLActions.SHOW_CONFIG, props<{ payload: any }>());

export const updateSelectedNodeOptions = createAction(RTLActions.UPDATE_SELECTED_NODE_OPTIONS);

export const resetRootStore = createAction(RTLActions.RESET_ROOT_STORE, props<{ payload: ConfigSettingsNode }>());

export const fetchRTLConfig = createAction(RTLActions.FETCH_RTL_CONFIG);

export const setRTLConfig = createAction(RTLActions.SET_RTL_CONFIG, props<{ payload: RTLConfiguration }>());

export const saveSettings = createAction(RTLActions.SAVE_SETTINGS, props<{ payload: SaveSettings }>());

export const twoFASaveSettings = createAction(RTLActions.TWO_FA_SAVE_SETTINGS, props<{ payload: { secret2fa: string } }>());

export const setSelectedNode = createAction(RTLActions.SET_SELECTED_NODE, props<{ payload: SetSelectedNode }>());

export const updateRootNodeSettings = createAction(RTLActions.UPDATE_ROOT_NODE_SETTINGS, props<{ payload: UpdateServiceSetting }>());

export const updateServiceSettings = createAction(RTLActions.UPDATE_SERVICE_SETTINGS, props<{ payload: UpdateServiceSetting }>());

export const setNodeData = createAction(RTLActions.SET_NODE_DATA, props<{ payload: GetInfoRoot }>());

export const saveSSO = createAction(RTLActions.SAVE_SSO, props<{ payload: SSO }>());

export const logout = createAction(RTLActions.LOGOUT);

export const resetPassword = createAction(RTLActions.RESET_PASSWORD, props<{ payload: ResetPassword }>());

export const resetPasswordRes = createAction(RTLActions.RESET_PASSWORD_RES, props<{ payload: { token: string } }>());

export const isAuthorized = createAction(RTLActions.IS_AUTHORIZED, props<{ payload: string }>());

export const isAuthorizedRes = createAction(RTLActions.IS_AUTHORIZED_RES, props<{ payload: any }>());

export const login = createAction(RTLActions.LOGIN, props<{ payload: Login }>());

export const verifyTwoFA = createAction(RTLActions.VERIFY_TWO_FA, props<{ payload: VerifyTwoFA }>());

export const fetchFile = createAction(RTLActions.FETCH_FILE, props<{ payload: FetchFile }>());

export const showFile = createAction(RTLActions.SHOW_FILE, props<{ payload: any }>());
