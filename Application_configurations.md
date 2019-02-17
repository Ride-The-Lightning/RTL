RTL allows the user to configure and control specific application parameters for app customization and integration.
The parameters can be configured via RTL.conf file or through environment variables defined at the OS level.

#### RTL.conf
```
[Authentication]
macaroonPath=<Path for the folder containing 'admin.macaroon' file>
nodeAuthType=<For stand alone RTL authentication. Allowed values - CUSTOM, DEFAULT>
lndConfigPath=<Full path of the lnd.conf file including the file name>
rtlPass=<For 'nodeAuthType=CUSTOM', the password in plain text>

[Settings]
flgSidenavOpened=true <Set by RTL>
flgSidenavPinned=true <Set by RTL>
menu=Vertical <Set by RTL>
menuType=Regular <Set by RTL>
theme=dark-blue <Set by RTL>
satsToBTC=false <Set by RTL>
bitcoindConfigPath=<Full path of the bitcoind.conf file including the file name>
enableLogging=<parameter to turn RTL logging off/on. Allowed values - true, false>
port=3000 <port number for the rtl node server, default 3000>
lndServerUrl=https://localhost:8080/v1 <LND server URL for REST APIs. Default is 'https://localhost:8080/v1'>

[SSO]
rtlSSO=0 <Single Sign On control. Allowed values - 1,0. 1-single sign on via an external cookie, 0-stand alone RTL authentication>
rtlCookiePath= <Required if 'rtlSSO=1'. Full path of the cookie file including the file name>
logoutRedirectLink=/login <Required if 'rtlSSO=1'. URL to re-direct to after logout/timeout from RTL>
```

#### Environment variables
