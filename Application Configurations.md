RTL allows the user to configure and control specific application parameters for app customization and integration.
The parameters can be configured via RTL.conf file or through environment variables defined at the OS level.

#### RTL.conf
```
[Authentication]
macaroonPath=
nodeAuthType=DEFAULT
lndConfigPath=
rtlPass=

[Settings]
flgSidenavOpened=true
flgSidenavPinned=true
menu=Vertical
menuType=Regular
theme=dark-blue
satsToBTC=false
bitcoindConfigPath=
enableLogging=true
port=3000
lndServerUrl=https://localhost:8080/v1

[SSO]
rtlSSO=0
rtlCookiePath=
logoutRedirectLink=/login
```

#### Environment variables
