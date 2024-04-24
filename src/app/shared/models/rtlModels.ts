import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Node, Settings } from './RTLconfig';
import { SafeHtml } from '@angular/platform-browser';

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

export interface FiatCurrency {
  id: string;
  name: string;
  iconType: 'SVG' | 'FA';
  symbol: string | IconDefinition | SafeHtml;
}
