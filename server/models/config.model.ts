export class SSO {

  constructor(
    public rtlSso?: number,
    public rtlCookiePath?: string,
    public logoutRedirectLink?: string,
    public cookieValue?: string
  ) { }

}

export class Settings {

  constructor(
    public lnServerUrl?: string,
    public swapServerUrl?: string,
    public boltzServerUrl?: string,
    public bitcoindConfigPath?: string,
    public channelBackupPath?: string,
    public logLevel?: string,
    public logFile?: string,
    public userPersona?: string,
    public themeMode?: string,
    public themeColor?: string,
    public unannouncedChannels?: boolean,
    public fiatConversion?: boolean,
    public currencyUnit?: string,
    public enableOffers?: boolean,
    public enablePeerswap?: boolean
  ) { }

}

export class Authentication {

  constructor(
    public options?: any,
    public configPath?: string,
    public macaroonPath?: string,
    public macaroonValue?: string,
    public runePath?: string,
    public runeValue?: string,
    public lnApiPassword?: string,
    public swapMacaroonPath?: string,
    public boltzMacaroonPath?: string
  ) { }

}

export class ApplicationConfig {

  constructor(
    public defaultNodeIndex: number,
    public selectedNodeIndex: number,
    public dbDirectoryPath?: string,
    public rtlConfFilePath?: string,
    public rtlPass?: string,
    public multiPass?: string,
    public multiPassHashed?: string,
    public allowPasswordUpdate?: boolean,
    public enable2FA?: boolean,
    public secret2FA?: string,
    public SSO?: SSO,
    public nodes?: SelectedNode[]
  ) {}

}

export class SelectedNode {

  constructor(
    public logLevel?: string,
    public logFile?: string,
    public index?: number,
    public lnNode?: string,
    public lnImplementation?: string,
    public lnVersion?: string,
    public Settings?: Settings,
    public Authentication?: Authentication
  ) { }

}

export class LogJSONObj {

  constructor(
    public level?: string,
    public msg?: string,
    public data?: string | any | any[],
    public error?: string | any,
    public fileName?: string,
    public selectedNode?: SelectedNode
  ) { }

}
