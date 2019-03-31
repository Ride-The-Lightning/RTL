export class Settings {
  constructor(
    public flgSidenavOpened: boolean,
    public flgSidenavPinned: boolean,
    public menu: string,
    public menuType: string,
    public theme: string,
    public satsToBTC: boolean
  ) { }
}

export class MultiNode {
  constructor(
    public index: string,
    public lnNode: string,
    public lnImplementation: string
  ) { }
}

export class Authentication {
  constructor(
    public lndServerUrl?: string,
    public macaroonPath?: string,
    public nodeAuthType?: string,
    public lndConfigPath?: string,
    public bitcoindConfigPath?: string,
    public rtlPass?: string,
    public enableLogging?: string,
    public rtlSSO?: number,
    public logoutRedirectLink?: string
  ) { }
}

export class RTLConfiguration {
  constructor(
    public settings: Settings,
    public authentication: Authentication
  ) { }
}
