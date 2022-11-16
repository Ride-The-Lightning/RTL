export class CommonSelectedNode {

  constructor(
    public options?: any,
    public ln_server_url?: string,
    public macaroon_path?: string,
    public ln_api_password?: string,
    public swap_server_url?: string,
    public boltz_server_url?: string,
    public config_path?: string,
    public rtl_conf_file_path?: string,
    public swap_macaroon_path?: string,
    public boltz_macaroon_path?: string,
    public bitcoind_config_path?: string,
    public channel_backup_path?: string,
    public log_level?: string,
    public log_file?: string,
    public index?: string,
    public ln_node?: string,
    public ln_implementation?: string,
    public user_persona?: string,
    public theme_mode?: string,
    public theme_color?: string,
    public unannounced_channels?: boolean,
    public fiat_conversion?: boolean,
    public currency_unit?: string,
    public ln_version?: string,
    public api_version?: string,
    public enable_offers?: boolean,
    public enable_peerswap?: boolean
  ) { }

}

export class AuthenticationConfiguration {

  constructor(
    public configPath?: string,
    public swapMacaroonPath?: string,
    public boltzMacaroonPath?: string
  ) { }

}

export class NodeSettingsConfiguration {

  constructor(
    public userPersona?: string,
    public themeMode?: string,
    public themeColor?: string,
    public unannouncedChannels?: boolean,
    public fiatConversion?: boolean,
    public currencyUnit?: string,
    public bitcoindConfigPath?: string,
    public logLevel?: string,
    public lnServerUrl?: string,
    public swapServerUrl?: string,
    public boltzServerUrl?: string,
    public channelBackupPath?: string,
    public enableOffers?: boolean,
    public enablePeerswap?: boolean
  ) { }

}

export class LogJSONObj {

  constructor(
    public level?: string,
    public msg?: string,
    public data?: string | any | any[],
    public error?: string | any,
    public fileName?: string,
    public selectedNode?: CommonSelectedNode
  ) { }

}
