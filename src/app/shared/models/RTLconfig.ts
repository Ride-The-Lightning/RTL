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
    public unannouncedChannels: boolean,
    public fiatConversion: boolean,
    public currencyUnits: Array<string>,
    public bitcoindConfigPath?: string,
    public logLevel?: string,
    public lnServerUrl?: string,
    public swapServerUrl?: string,
    public boltzServerUrl?: string,
    public channelBackupPath?: string,
    public currencyUnit?: string,
    public enableOffers?: boolean,
    public enablePeerswap?: boolean
  ) { }

}

export class Authentication {

  constructor(
    public swapMacaroonPath: string,
    public boltzMacaroonPath: string,
    public configPath?: string
  ) { }

}

export class Node {

  constructor(
    public Settings: Settings,
    public Authentication: Authentication,
    public index?: number,
    public lnNode?: string,
    public lnImplementation?: string
  ) { }

}

export class RTLConfiguration {

  constructor(
    public defaultNodeIndex: number,
    public selectedNodeIndex: number,
    public SSO: SSO,
    public enable2FA: boolean,
    public secret2FA: string,
    public allowPasswordUpdate: boolean,
    public nodes: Node[]
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
}

export interface SelNodeChild {
  userPersona?: string;
  channelBackupPath?: string;
  selCurrencyUnit?: string;
  currencyUnits?: string[];
  fiatConversion?: boolean;
  unannouncedChannels?: boolean;
  lnImplementation?: string;
  swapServerUrl?: string;
  boltzServerUrl?: string;
  enableOffers?: boolean;
  enablePeerswap?: boolean;
}

export class HelpTopic {

  constructor(public help: { question: string, answer: string, link?: string, linkCaption?: string, lnImplementation?: string }) { }

}
