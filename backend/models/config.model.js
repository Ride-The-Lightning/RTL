export class CommonSelectedNode {
    constructor(options, ln_server_url, macaroon_path, ln_api_password, swap_server_url, boltz_server_url, config_path, rtl_conf_file_path, swap_macaroon_path, boltz_macaroon_path, bitcoind_config_path, channel_backup_path, log_level, log_file, index, ln_node, ln_implementation, user_persona, theme_mode, theme_color, fiat_conversion, currency_unit, api_version) {
        this.options = options;
        this.ln_server_url = ln_server_url;
        this.macaroon_path = macaroon_path;
        this.ln_api_password = ln_api_password;
        this.swap_server_url = swap_server_url;
        this.boltz_server_url = boltz_server_url;
        this.config_path = config_path;
        this.rtl_conf_file_path = rtl_conf_file_path;
        this.swap_macaroon_path = swap_macaroon_path;
        this.boltz_macaroon_path = boltz_macaroon_path;
        this.bitcoind_config_path = bitcoind_config_path;
        this.channel_backup_path = channel_backup_path;
        this.log_level = log_level;
        this.log_file = log_file;
        this.index = index;
        this.ln_node = ln_node;
        this.ln_implementation = ln_implementation;
        this.user_persona = user_persona;
        this.theme_mode = theme_mode;
        this.theme_color = theme_color;
        this.fiat_conversion = fiat_conversion;
        this.currency_unit = currency_unit;
        this.api_version = api_version;
    }
}
export class AuthenticationConfiguration {
    constructor(configPath, swapMacaroonPath, boltzMacaroonPath) {
        this.configPath = configPath;
        this.swapMacaroonPath = swapMacaroonPath;
        this.boltzMacaroonPath = boltzMacaroonPath;
    }
}
export class NodeSettingsConfiguration {
    constructor(userPersona, themeMode, themeColor, fiatConversion, currencyUnit, bitcoindConfigPath, logLevel, lnServerUrl, swapServerUrl, boltzServerUrl, channelBackupPath) {
        this.userPersona = userPersona;
        this.themeMode = themeMode;
        this.themeColor = themeColor;
        this.fiatConversion = fiatConversion;
        this.currencyUnit = currencyUnit;
        this.bitcoindConfigPath = bitcoindConfigPath;
        this.logLevel = logLevel;
        this.lnServerUrl = lnServerUrl;
        this.swapServerUrl = swapServerUrl;
        this.boltzServerUrl = boltzServerUrl;
        this.channelBackupPath = channelBackupPath;
    }
}
export class LogJSONObj {
    constructor(level, msg, data, error, fileName, selectedNode) {
        this.level = level;
        this.msg = msg;
        this.data = data;
        this.error = error;
        this.fileName = fileName;
        this.selectedNode = selectedNode;
    }
}
