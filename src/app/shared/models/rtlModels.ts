import { ServicesEnum } from '../services/consts-enums-functions';
import { Node, Settings } from './RTLconfig';

export interface OpenSnackBar {
  message: string;
  duration?: number;
  type?: string;
}

export interface SetSelectedNode {
  uiMessage: string;
  prevLnNodeIndex: number;
  currentLnNode: Node | null;
  isInitialSetup: boolean;
}

export interface UpdateNodeSettings {
  index: number;
  settings: Settings;
}

export interface ResetPassword {
  currPassword: string;
  newPassword: string;
}

export interface Login {
  password: string;
  defaultPassword: boolean;
  twoFAToken?: string;
}

export interface VerifyTwoFA {
  token: string;
  authResponse: any;
}

export interface FetchFile {
  channelPoint: string;
  path?: string;
}
