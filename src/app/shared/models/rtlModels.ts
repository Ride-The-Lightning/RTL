import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Node, Settings } from './RTLconfig';
import { SafeHtml } from '@angular/platform-browser';

export interface OpenSnackBar {
  message: string;
  duration?: number;
  type?: string;
}

export interface UpdateSelectedNode {
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
  class?: string;
}

export interface ConvertedCurrency {
  unit: string;
  iconType: 'FA' | 'SVG';
  symbol: string | IconDefinition | SafeHtml;
  Sats: number;
  BTC: number;
  OTHER: number;
};

export interface RecommendedFeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee?: number;
  minimumFee?: number;
};

export interface BETransactionVOut {
  value: number;
  scriptpubkey?: string;
  scriptpubkey_asm?: string;
  scriptpubkey_type?: string;
  scriptpubkey_address?: string;
}

export interface BETransactionVIn {
  txid: string;
  vout?: string;
  prevout?: BETransactionVOut;
  scriptsig?: string;
  scriptsig_asm?: string;
  witness?: string[];
  is_coinbase?: boolean;
  sequence?: number;
}

export interface BlockExplorerTransaction {
  txid: string;
  version?: number;
  locktime?: number;
  size?: number;
  weight?: number;
  sigops?: number;
  fee?: number;
  status?: any;
  vin?: BETransactionVIn[];
  vout?: BETransactionVOut[];
}
