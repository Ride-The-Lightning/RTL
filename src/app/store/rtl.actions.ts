import { Action } from '@ngrx/store';
import { RTLConfiguration, Settings, Node } from '../shared/models/RTLconfig';
import { ErrorPayload } from '../shared/models/errorPayload';
import { MatDialogConfig } from '@angular/material';

export const RESET_STORE = 'RESET_STORE';
export const CLEAR_EFFECT_ERROR = 'CLEAR_EFFECT_ERROR';
export const EFFECT_ERROR = 'EFFECT_ERROR';
export const OPEN_SPINNER = 'OPEN_SPINNER';
export const CLOSE_SPINNER = 'CLOSE_SPINNER';
export const OPEN_ALERT = 'OPEN_ALERT';
export const CLOSE_ALERT = 'CLOSE_ALERT';
export const OPEN_CONFIRMATION = 'OPEN_CONFIRMATION';
export const CLOSE_CONFIRMATION = 'CLOSE_CONFIRMATION';
export const FETCH_STORE = 'FETCH_STORE';
export const SET_STORE = 'SET_STORE';
export const FETCH_RTL_CONFIG = 'FETCH_RTL_CONFIG';
export const SET_RTL_CONFIG = 'SET_RTL_CONFIG';
export const SAVE_SETTINGS = 'SAVE_SETTINGS';
export const SET_SELECTED_NODE = 'SET_SELECTED_NODE';
export const IS_AUTHORIZED = 'IS_AUTHORIZED';
export const IS_AUTHORIZED_RES = 'IS_AUTHORIZED_RES';
export const SIGNIN = 'SIGNIN';
export const SIGNOUT = 'SIGNOUT';
export const INIT_APP_DATA = 'INIT_APP_DATA';

export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR;
  constructor(public payload: string) {} // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR;
  constructor(public payload: ErrorPayload) {}
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
  constructor(public payload: MatDialogConfig) {}
}

export class CloseAlert implements Action {
  readonly type = CLOSE_ALERT;
}

export class OpenConfirmation implements Action {
  readonly type = OPEN_CONFIRMATION;
  constructor(public payload: MatDialogConfig) {}
}

export class CloseConfirmation implements Action {
  readonly type = CLOSE_CONFIRMATION;
  constructor(public payload: boolean) {}
}

export class ResetStore implements Action {
  readonly type = RESET_STORE;
  constructor(public payload: Node) {}
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
  constructor(public payload: Settings) {}
}

export class SetSelelectedNode implements Action {
  readonly type = SET_SELECTED_NODE;
  constructor(public payload: Node) {}
}

export class IsAuthorized implements Action {
  readonly type = IS_AUTHORIZED;
  constructor(public payload: string) {} // payload = password
}

export class IsAuthorizedRes implements Action {
  readonly type = IS_AUTHORIZED_RES;
  constructor(public payload: any) {} // payload = token/error
}

export class Signin implements Action {
  readonly type = SIGNIN;
  constructor(public payload: string) {} // payload = password
}

export class Signout implements Action {
  readonly type = SIGNOUT;
  constructor() {}
}

export class InitAppData implements Action {
  readonly type = INIT_APP_DATA;
}

export type RTLActions =
  ClearEffectError | EffectError | OpenSpinner | CloseSpinner |
  FetchRTLConfig | SetRTLConfig | SaveSettings |
  OpenAlert | CloseAlert |  OpenConfirmation | CloseConfirmation |
  ResetStore | SetSelelectedNode |
  IsAuthorized | IsAuthorizedRes | Signin | Signout | InitAppData;
