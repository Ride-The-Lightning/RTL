import { ServicesEnum } from '../services/consts-enums-functions';
import { ConfigSettingsNode, Settings } from './RTLconfig';

export interface OpenSnackBar {
  message: string;
  duration?: number;
  type?: string;
}

export interface SaveSettings {
  uiMessage: string;
  settings?: Settings;
  defaultNodeIndex?: number;
}

export interface SetSelectedNode {
  uiMessage: string;
  prevLnNodeIndex: number;
  currentLnNode: ConfigSettingsNode | null;
  isInitialSetup: boolean;
}

export interface UpdateServiceSetting {
  uiMessage: string;
  service: ServicesEnum;
  settings: any;
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
