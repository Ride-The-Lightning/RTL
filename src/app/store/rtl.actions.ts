import { Action } from '@ngrx/store';

import { ErrorPayload } from '../shared/models/errorPayload';
import { DialogConfig } from '../shared/models/alertData';
import { RTLConfiguration, Settings, ConfigSettingsNode, GetInfoRoot, SSO } from '../shared/models/RTLconfig';
import { ServicesEnum } from '../shared/services/consts-enums-functions';

export const VOID = 'VOID';
export const UPDATE_SELECTED_NODE_OPTIONS = 'UPDATE_SELECTED_NODE_OPTIONS';
export const RESET_ROOT_STORE = 'RESET_ROOT_STORE';
export const CLEAR_EFFECT_ERROR_ROOT = 'CLEAR_EFFECT_ERROR_ROOT';
export const EFFECT_ERROR_ROOT = 'EFFECT_ERROR_ROOT';
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

export class VoidAction implements Action {
  readonly type = VOID;
}

export class ClearEffectErrorRoot implements Action {
  readonly type = CLEAR_EFFECT_ERROR_ROOT;
  constructor(public payload: string) {} // payload = errorAction
}

export class EffectErrorRoot implements Action {
  readonly type = EFFECT_ERROR_ROOT;
  constructor(public payload: ErrorPayload) {}
}

export class CloseAllDialogs implements Action {
  readonly type = CLOSE_ALL_DIALOGS;
}

export class OpenSnackBar implements Action {
  readonly type = OPEN_SNACK_BAR;
  constructor(public payload: string | {message: string, duration: number}) {}
}

export class OpenSpinner implements Action {
  readonly type = OPEN_SPINNER;
  constructor(public payload: string) {} // payload = titleMessage
}

export class CloseSpinner implements Action {
  readonly type = CLOSE_SPINNER;
}

export class OpenAlert implements Action {
  readonly type = OPEN_ALERT;
  constructor(public payload: DialogConfig) {}
}

export class CloseAlert implements Action {
  readonly type = CLOSE_ALERT;
  constructor(public payload: any) {}
}

export class OpenConfirmation implements Action {
  readonly type = OPEN_CONFIRMATION;
  constructor(public payload: DialogConfig) {}
}

export class CloseConfirmation implements Action {
  readonly type = CLOSE_CONFIRMATION;
  constructor(public payload: boolean) {}
}

export class ShowPubkey implements Action {
  readonly type = SHOW_PUBKEY;
  constructor() {}
}

export class FetchConfig implements Action {
  readonly type = FETCH_CONFIG;
  constructor(public payload: string) {} // payload = ln/bitcoin node
}

export class ShowConfig implements Action {
  readonly type = SHOW_CONFIG;
  constructor(public payload: any) {} // payload = Config File
}

export class UpdateSelectedNodeOptions implements Action {
  readonly type = UPDATE_SELECTED_NODE_OPTIONS;
}

export class ResetRootStore implements Action {
  readonly type = RESET_ROOT_STORE;
  constructor(public payload: ConfigSettingsNode) {}
}

export class FetchRTLConfig implements Action {
  readonly type = FETCH_RTL_CONFIG;
}

export class SetRTLConfig implements Action {
  readonly type = SET_RTL_CONFIG;
  constructor(public payload: RTLConfiguration) {}
}

export class SaveSettings implements Action {
  readonly type = SAVE_SETTINGS;
  constructor(public payload: {settings?: Settings, defaultNodeIndex?: number}) {}
}

export class TwoFASaveSettings implements Action {
  readonly type = TWO_FA_SAVE_SETTINGS;
  constructor(public payload: {secret2fa: string}) {}
}

export class SetSelelectedNode implements Action {
  readonly type = SET_SELECTED_NODE;
  constructor(public payload: { lnNode: ConfigSettingsNode, isInitialSetup: boolean }) {}
}

export class UpdateServiceSettings implements Action {
  readonly type = UPDATE_SERVICE_SETTINGS;
  constructor(public payload: { service: ServicesEnum, settings: any }) {}
}

export class SetNodeData implements Action {
  readonly type = SET_NODE_DATA;
  constructor(public payload: GetInfoRoot) {}
}

export class SaveSSO implements Action {
  readonly type = SAVE_SSO;
  constructor(public payload: SSO) {}
}

export class Logout implements Action {
  readonly type = LOGOUT;
  constructor() {}
}

export class ResetPassword implements Action {
  readonly type = RESET_PASSWORD;
  constructor(public payload: {currPassword: string, newPassword: string}) {}
}

export class ResetPasswordRes implements Action {
  readonly type = RESET_PASSWORD_RES;
  constructor(public payload: {token: string}) {}
}

export class IsAuthorized implements Action {
  readonly type = IS_AUTHORIZED;
  constructor(public payload: string) {} // payload = password
}

export class IsAuthorizedRes implements Action {
  readonly type = IS_AUTHORIZED_RES;
  constructor(public payload: any) {} // payload = token/error
}

export class Login implements Action {
  readonly type = LOGIN;
  constructor(public payload: {password: string, defaultPassword: boolean, twoFAToken?: string}) {}
}

export class VerifyTwoFA implements Action {
  readonly type = VERIFY_TWO_FA;
  constructor(public payload: {token: string, authResponse: any}) {}
}

export class FetchFile implements Action {
  readonly type = FETCH_FILE;
  constructor(public payload: {channelPoint: string, path?: string}) {}
}

export class ShowFile implements Action {
  readonly type = SHOW_FILE;
  constructor(public payload: any) {}
}

export type RTLActions = ClearEffectErrorRoot | EffectErrorRoot |
  IsAuthorized | IsAuthorizedRes | Login | VerifyTwoFA |
  VoidAction | CloseAllDialogs | OpenSnackBar | OpenSpinner | CloseSpinner | FetchRTLConfig | SetRTLConfig | SaveSettings |
  OpenAlert | CloseAlert |  OpenConfirmation | CloseConfirmation | ShowPubkey | FetchConfig | ShowConfig |
  UpdateSelectedNodeOptions | ResetRootStore |
  SetSelelectedNode | SetNodeData | SaveSSO | UpdateServiceSettings |
  Logout | ResetPassword | ResetPasswordRes | FetchFile | ShowFile;
