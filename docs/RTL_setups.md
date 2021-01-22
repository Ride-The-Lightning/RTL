### Documenting the different RTL setups and the corresponding config tweaks

#### RTL Server+LND running on the same device
For this type of setup, just follow the instructions on the [readme](../README.md)

#### RTL Server and LND running on different devices (Local LAN)
If your running RTL and LND on different devices on your local LAN, certain config changes need to be made in LND and RTL conf files.
1. A static IP address must be assigned to the device running LND
2. `admin.macaroon` file must be transferred to the device on which you need to run RTL
3. Add to your lnd.conf file under the [Application Options] section: `restlisten=<ip address of the device running LND>:8080`
4. Restart LND
5. Make the following changes to the RTL-Config.json file
```
{
  "multiPass": "<password in plain text, Default 'password'>",
  "port": "3000",
  "defaultNodeIndex": 1,
  "SSO": {
    "rtlSSO": 0,
    "rtlCookiePath": "",
    "logoutRedirectLink": ""
  },
  "nodes": [
    {
      "index": 1,
      "lnNode": "LND Testnet",
      "lnImplementation": "LND",
      "Authentication": {
        "macaroonPath": "<Path of the folder containing 'admin.macaroon' on the device running RTL>",
        "swapMacaroonPath": "<Path of the folder containing 'loop.macaroon' on the device running RTL>",
        "boltzMacaroonPath": "<Path of the folder containing 'admin.macaroon' on the device running RTL>",
        "configPath": "<Optional:Path of the lnd.conf if present locally or empty>"
      },
      "Settings": {
        "userPersona": "OPERATOR",
        "themeMode": "DAY",
        "themeColor": "PURPLE",
        "channelBackupPath": "<RTL Root path + \backup\node-1>",
        "bitcoindConfigPath": "<Optional: path of bitcoind.conf path if available locally>",
        "enableLogging": false,
        "fiatConversion": false,
        "lnServerUrl": "<https://<ip-address-of-device-running-lnd>:8080; e.g. https://192.168.0.1:8080>",
        "swapServerUrl": "<https://<localhost>:8081>",
        "boltzServerUrl": "<https://<localhost>:9003>"
      }
    }
  ]
}
```
6. Restart RTL
7. Access RTL by opening your browser at the following address: http://localhost:3000

#### RTL and LND running on different devices (with LND running on an external network or a cloud service)

In case you need to run RTL with an external node, you need to ensure that RTL is served on https, by running it behind a webserver like [nginx](https://nginx.org/en/download.html) encrypted with your [letsencrypt](https://letsencrypt.org) certificate.

A sample SSL setup guide can be found [here](RTL_SSL_setup.md)
