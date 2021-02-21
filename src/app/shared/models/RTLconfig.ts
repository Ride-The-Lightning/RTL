import { GetInfoChain } from './lndModels';

export class SSO {
  constructor(
    public rtlSSO: number,
    public logoutRedirectLink: string
  ) { }
}

export class Settings {
  constructor(
    public userPersona: string,
    public themeMode: string,
    public themeColor: string,
    public currencyUnits: Array<string>,
    public fiatConversion: boolean,
    public bitcoindConfigPath?: string,
    public enableLogging?: boolean,
    public lnServerUrl?: string,
    public swapServerUrl?: string,
    public boltzServerUrl?: string,
    public channelBackupPath?: string,
    public currencyUnit?: string
  ) { }
}

export class Authentication {
  constructor(
    public swapMacaroonPath: string,
    public boltzMacaroonPath: string,
    public configPath?: string
  ) { }
}

export class ConfigSettingsNode {
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
    public defaultNodeIndex: number,
    public selectedNodeIndex: number,
    public sso: SSO,
    public enable2FA: boolean,
    public nodes: ConfigSettingsNode[]
  ) { }
}

export interface GetInfoRoot {
  identity_pubkey?: string;
  alias?: string;
  testnet?: boolean;
  chains?: GetInfoChain[] | string[];
  uris?: string[];  
  version?: string;
  api_version?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;  
}

export interface SelNodeChild {
  userPersona?: string;
  channelBackupPath?: string;
  selCurrencyUnit?: string;  
  currencyUnits?: string[];
  fiatConversion?: boolean;
  lnImplementation?: string;
  swapServerUrl?: string;
  boltzServerUrl?: string;
}

export class HelpTopic {
  constructor(public help: {question: string, answer: string, link?: string, linkCaption?: string, lnImplementation?: string}) { }
}