import { GetInfoChain } from './lndModels';

export enum AuthenticateWith {
  TOKEN = 'TOKEN',
  PASSWORD = 'PASSWORD'
}

export class SSO {
  constructor(
    public rtlSSO: number,
    public logoutRedirectLink: string
  ) { }
}

export class Settings {
  constructor(
    public flgSidenavOpened: boolean,
    public flgSidenavPinned: boolean,
    public menu: string,
    public menuType: string,
    public fontSize: string,
    public themeMode: string,
    public themeColor: string,
    public satsToBTC: boolean,
    public bitcoindConfigPath?: string,
    public enableLogging?: boolean,
    public lnServerUrl?: string,
    public channelBackupPath?: string
  ) { }
}

export class Authentication {
  constructor(
    public nodeAuthType?: string,
    public configPath?: string,
    public bitcoindConfigPath?: string
  ) { }
}

export class LightningNode {
  constructor(
    public settings: Settings,
    public authentication: Authentication,
    public index?: string,
    public lnNode?: string,
    public lnImplementation?: string
  ) { }
}

export class RTLConfiguration {
  constructor(
    public selectedNodeIndex: number,
    public sso: SSO,
    public nodes: LightningNode[]
  ) { }
}

export interface GetInfoRoot {
  identity_pubkey?: string;
  alias?: string;
  testnet?: boolean;
  chains?: GetInfoChain[] | string[];
  version?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;  
  numberOfPendingChannels?: number;
}

export interface SelNodeChild {
  channelBackupPath?: string;
  satsToBTC?: boolean;
}
