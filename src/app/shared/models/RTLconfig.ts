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
    public flgSidenavOpened: boolean,
    public flgSidenavPinned: boolean,
    public menu: string,
    public menuType: string,
    public fontSize: string,
    public themeMode: string,
    public themeColor: string,
    public satsToBTC: boolean,
    public currencyUnits: Array<string>,
    public fiatConversion: boolean,
    public bitcoindConfigPath?: string,
    public enableLogging?: boolean,
    public lnServerUrl?: string,
    public channelBackupPath?: string,
    public currencyUnit?: string,
  ) { }
}

export class Authentication {
  constructor(
    public nodeAuthType?: string,
    public configPath?: string,
    public bitcoindConfigPath?: string
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
  currency_unit?: string;
  smaller_currency_unit?: string;  
}

export interface SelNodeChild {
  userPersona?: string;
  channelBackupPath?: string;
  satsToBTC?: boolean;
  selCurrencyUnit?: string;  
  currencyUnits?: string[];
  fiatConversion?: boolean;
}

export class HelpTopic {
  constructor(public help: {question: string, answer: string, link?: string, linkCaption?: string, lnImplementation?: string}) { }
}