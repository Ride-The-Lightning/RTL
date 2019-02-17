RTL allows the user to configure and control specific application parameters for app customization and integration.
The parameters can be configured via RTL.conf file or through environment variables defined at the OS level.

#### RTL.conf

[Authentication]
;Path for the folder containing 'admin.macaroon' file

macaroonPath=<>

;For stand alone RTL authentication. Allowed values - CUSTOM, DEFAULT

nodeAuthType=<>

;Full path of the lnd.conf file including the file name

lndConfigPath=<>

;For 'nodeAuthType=CUSTOM', the password in plain text

rtlPass=<>

[Settings]
;Set by RTL
flgSidenavOpened=true
;Set by RTL
flgSidenavPinned=true
;Set by RTL
menu=Vertical
;Set by RTL
menuType=Regular
;Set by RTL
theme=dark-blue
;Set by RTL
satsToBTC=false
;Full path of the bitcoind.conf file including the file name
bitcoindConfigPath=<>
;parameter to turn RTL logging off/on. Allowed values - true, false
enableLogging=<>
;port number for the rtl node server, default 3000
port=3000
;<LND server URL for REST APIs.
;Default is 'https://localhost:8080/v1'
lndServerUrl=https://localhost:8080/v1 

[SSO]
;Single Sign On control
;Allowed values - 1,0
;1-single sign on via an external cookie
;0-stand alone RTL authentication
rtlSSO=0
;Required if 'rtlSSO=1'
;Full path of the cookie file including the file name
rtlCookiePath=<>
;Required if 'rtlSSO=1'
;URL to re-direct to after logout/timeout from RTL
logoutRedirectLink=/login

#### Environment variables
