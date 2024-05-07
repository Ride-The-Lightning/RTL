export class SSO {
    constructor(rtlSso, rtlCookiePath, logoutRedirectLink, cookieValue) {
        this.rtlSso = rtlSso;
        this.rtlCookiePath = rtlCookiePath;
        this.logoutRedirectLink = logoutRedirectLink;
        this.cookieValue = cookieValue;
    }
}
export class Settings {
    constructor(blockExplorerUrl, lnServerUrl, swapServerUrl, boltzServerUrl, bitcoindConfigPath, channelBackupPath, logLevel, logFile, userPersona, themeMode, themeColor, unannouncedChannels, fiatConversion, currencyUnit, enableOffers, enablePeerswap) {
        this.blockExplorerUrl = blockExplorerUrl;
        this.lnServerUrl = lnServerUrl;
        this.swapServerUrl = swapServerUrl;
        this.boltzServerUrl = boltzServerUrl;
        this.bitcoindConfigPath = bitcoindConfigPath;
        this.channelBackupPath = channelBackupPath;
        this.logLevel = logLevel;
        this.logFile = logFile;
        this.userPersona = userPersona;
        this.themeMode = themeMode;
        this.themeColor = themeColor;
        this.unannouncedChannels = unannouncedChannels;
        this.fiatConversion = fiatConversion;
        this.currencyUnit = currencyUnit;
        this.enableOffers = enableOffers;
        this.enablePeerswap = enablePeerswap;
    }
}
export class Authentication {
    constructor(options, configPath, macaroonPath, macaroonValue, runePath, runeValue, lnApiPassword, swapMacaroonPath, boltzMacaroonPath) {
        this.options = options;
        this.configPath = configPath;
        this.macaroonPath = macaroonPath;
        this.macaroonValue = macaroonValue;
        this.runePath = runePath;
        this.runeValue = runeValue;
        this.lnApiPassword = lnApiPassword;
        this.swapMacaroonPath = swapMacaroonPath;
        this.boltzMacaroonPath = boltzMacaroonPath;
    }
}
export class ApplicationConfig {
    constructor(defaultNodeIndex, selectedNodeIndex, dbDirectoryPath, rtlConfFilePath, rtlPass, multiPass, multiPassHashed, allowPasswordUpdate, enable2FA, secret2FA, SSO, nodes) {
        this.defaultNodeIndex = defaultNodeIndex;
        this.selectedNodeIndex = selectedNodeIndex;
        this.dbDirectoryPath = dbDirectoryPath;
        this.rtlConfFilePath = rtlConfFilePath;
        this.rtlPass = rtlPass;
        this.multiPass = multiPass;
        this.multiPassHashed = multiPassHashed;
        this.allowPasswordUpdate = allowPasswordUpdate;
        this.enable2FA = enable2FA;
        this.secret2FA = secret2FA;
        this.SSO = SSO;
        this.nodes = nodes;
    }
}
export class SelectedNode {
    constructor(logLevel, logFile, index, lnNode, lnImplementation, lnVersion, settings, authentication) {
        this.logLevel = logLevel;
        this.logFile = logFile;
        this.index = index;
        this.lnNode = lnNode;
        this.lnImplementation = lnImplementation;
        this.lnVersion = lnVersion;
        this.settings = settings;
        this.authentication = authentication;
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
