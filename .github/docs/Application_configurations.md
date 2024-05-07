RTL allows the user to configure and control specific application parameters for app customization and integration.<br />
The parameters can be configured via RTL-Config.json file or through environment variables defined at the OS level. Required <br />
parameters have `default` values for initial setup and can be updated after RTL server initial start.<br />
<br />
### RTL-Config.json<br />
```
{
  "multiPass": "<The password in plain text, default 'password', Required>",
  "port": "<port number for the rtl node server, default '3000', Required>",
  "host": "<host for the rtl node server, default 'all IPs', Optional>",
  "defaultNodeIndex": <Default index to load when rtl server starts, default 1, Optional>,
  "dbDirectoryPath": "<Complete path of the folder where rtl database file should be saved, defults to RTL root, Optional>",
  "SSO": {
    "rtlSSO": <parameter to turn SSO off/on. Allowed values - 1 (single sign on via an external cookie), 0 (stand alone RTL authentication), Required>,
    "rtlCookiePath": "<Full path of the cookie file including the file name. The application url needs to pass the value from this cookie file as query param 'access-key' for the SSO authentication to work, Required if SSO=1 else empty (Optional)>",
    "logoutRedirectLink": "<URL to re-direct to after logout/timeout from RTL, Required if SSO=1 else empty (Optional)>"
  },
  "nodes": [
    {
      "index": <Incremental node indices starting from 1, Required>,
      "lnNode": "<Node name to uniquely identify the node in the UI, Required>",
      "lnImplementation": "<LNP implementation, Allowed values LND/CLN/ECL, Required>",
      "authentication": {
        "macaroonPath": "<Path for the folder containing 'admin.macaroon' for LND node, Required for LND>",
        "runePath": "<Complete path including filename for CLN rune for the node, Required for CLN>",
        "lnApiPassword": "<Password to be used for ECL API authentication. Mandatory only for ECL if the configPath is missing>"
        "swapMacaroonPath": "<Path for the folder containing 'loop.macaroon' (LND), Required for LND Loop>",
        "boltzMacaroonPath": "<Path for the folder containing 'admin.macaroon' (Boltz), Required for Boltz Swaps>",
        "configPath": "<Full path of the lnd.conf/core lightning config/eclair.conf file including the file name, if present locally, Optional, only mandatory for ECL if the lnApiPassword is missing>",
      },
      "settings": {
        "userPersona": "<User persona to tailor the data on UI. Allowed values MERCHANT/OPERATOR. Default MERCHANT, Optional>",
        "themeMode": "<Theme modes, Allowed values DAY, NIGHT. Default DAY, Optional>",
        "themeColor": "<Theme colors, Allowed values PURPLE, TEAL, INDIGO, PINK, YELLOW. Default PURPLE, Optional>",
        "channelBackupPath": "<Path to save channel backup file. Only for LND implementation, Default <RTL root>\backup\node-1, Optional>",
        "bitcoindConfigPath": "<Path of bitcoind.conf path if available locally>",
        "logLevel": <logging levels, will log in accordance with the logLevel value provided, Allowed values ERROR, WARN, INFO, DEBUG>,
        "fiatConversion": <parameter to turn fiat conversion off/on. Allowed values - true, false, default false, Optional>,
        "currencyUnit": "<Optional: Fiat current Unit for currency conversion, default 'USD', Optional>",
        "unannouncedChannels": <parameter to turn off/on setting for opening announced Channels, default false, Optional>
        "lnServerUrl": "<Service url for LND/Core Lightning REST APIs for the node, e.g. https://192.168.0.1:8080 OR https://192.168.0.1:3001 OR http://192.168.0.1:8080. Default 'https://127.0.0.1:8080', Optional>
        "swapServerUrl": "<Service url for swap server REST APIs for the node, e.g. https://127.0.0.1:8081, Optional>",
        "boltzServerUrl": "<Service url for boltz server REST APIs for the node, e.g. https://127.0.0.1:9003, Optional>",
        "blockExplorerUrl": "<url for local or centralized block explorer. e.g. https://mempool.space>"
      }
    }
  ]
}
```
<br />
### Environment variables<br />
The environment variable can also be used for all of the above configurations except the UI settings.<br />
If the environment variables are set, it will take precedence over the parameters in the RTL-Config.json file.<br />
<br />
PORT (port number for the rtl node server, default 3000, Optional)<br />
HOST (host for the rtl node server, default localhost, Optional)<br />
DB_DIRECTORY_PATH (Path for the folder where rtl database file should be saved, default RTL root directory, Optional)
APP_PASSWORD (Plaintext password to be provided by the parent container, NOT suggested for standalone RTL applications, to be used by Umbrel) (Optional)<br />
LN_IMPLEMENTATION (LND/CLN/ECL. Default 'LND', Optional)<br />
LN_SERVER_URL (LN server URL for LNP REST APIs, default https://127.0.0.1:8080) (Optional)<br />
SWAP_SERVER_URL (Swap server URL for REST APIs, default http://127.0.0.1:8081) (Optional)<br />
BOLTZ_SERVER_URL (Boltz server URL for REST APIs, default http://127.0.0.1:9003) (Optional)<br />
CONFIG_PATH (Full path of the LNP .conf file including the file name) (Optional for LND & CLN, Mandatory for ECL if LN_API_PASSWORD is undefined)<br />
MACAROON_PATH (Path for the folder containing 'admin.macaroon' for LND, Required for LND)<br />
RUNE_PATH (Complete path for the file containing 'rune' for CLN where the file should define the rune in 'LIGHTNING_RUNE="your-rune"' format, Required for CLN)<br />
SWAP_MACAROON_PATH (Path for the folder containing Loop's 'loop.macaroon', optional)<br />
BOLTZ_MACAROON_PATH (Path for the folder containing Boltz's 'admin.macaroon', optional)<br />
RTL_SSO (1 - single sign on via an external cookie, 0 - stand alone RTL authentication, Required)<br />
RTL_COOKIE_PATH (Full path of the cookie file including the file name, Required if RTL_SSO=1 else Optional)<br />
LOGOUT_REDIRECT_LINK (URL to re-direct to after logout/timeout from RTL, Required if RTL_SSO=1 else Optional)<br />
RTL_CONFIG_PATH (Path for the folder containing 'RTL-Config.json' file, Required)<br />
BITCOIND_CONFIG_PATH (Full path of the bitcoind.conf file including the file name, Optional)<br />
CHANNEL_BACKUP_PATH (Folder location for saving the channel backup files, valid for LND implementation only, Required if ln implementation=LND else Optional)<br />
ENABLE_OFFERS (Boolean flag to enable the offers feature on core lighning, default false, optional)<br />
ENABLE_PEERSWAP (Boolean flag to enable the peerswap feature on core lighning, default false, optional)<br />
LN_API_PASSWORD (Password for Eclair implementation if the eclair.conf path is not available, Required if ln implementation=ECL && config path is undefined)<br />
