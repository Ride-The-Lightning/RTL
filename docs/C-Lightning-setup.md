![](../screenshots/RTL-CLT-Home.png)

## RTL C-lightning setup

* [Introduction](#intro)
* [Pre-requisite](#prereq)
* [Architecture](#arch)
* [Installation](#install)
* [Prep for execution](#prep)
* [Start the server and access the app](#start)
* [Run RTL as a service](#service)

### <a name="intro"></a>Introduction
RTL can now be run to manage a c-lightning node via the UI.
Please note, this integration is currently in *alpha* testing phase and can be bug prone.

Follow the below steps to install and setup RTL to run on c-lightning.

### <a name="prereq"></a>Pre-requisites:
1. Functioning C-lightning node
2. NodeJS - Can be downloaded [here](https://nodejs.org/en/download)
3. Cl-Rest - Ensure that `cl-rest` API server is installed and running. Install instructions [here](https://github.com/Ride-The-Lightning/c-lightning-REST)
4. Copy the `access.macaroon` file from `cl-rest` to the device, on which RTL will be installed

### <a name="arch"></a>Architecture
![](../screenshots/RTL-C-lightning-Arch.png)

### <a name="install"></a>Installation:
#### First time setup
* Fetch sources from RTL git repository, by executing the below on the command prompt:

`$ git clone https://github.com/ShahanaFarooqui/RTL.git`
* Change directory to RTL folder:

`$ cd RTL`
* Fetch the dependencies and build the application by running:

`$ npm install`

#### Or: Update existing build
```
$ cd RTL
$ git reset --hard HEAD
$ git clean -f -d
$ git pull
$ npm install
```
### <a name="prep"></a>Prep for Execution
RTL requires its own config file `RTL-Multi-Node-Conf.json`, to start the server and provide user authentication on the app. 
* Rename `sample-RTL-Multi-Node-Conf.json` file to `RTL-Multi-Node-Conf.json`.
* Locate the complete path of the readable `access.macaroon` from `cl-rest` on your node.
* Modify the RTL conf file per the example file below

Ensure that the follow values are correct per your config:
* `lnImplementation` - This should be `CLT`, indicating that RTL is connecting to a c-lightning node.
* `macaroonPath` - Path of the folder containing `access.macaroon` file from cl-rest server.
* `lnServerUrl` - complete url with ip address and port of the cl-rest server.
* `multiPass` - Specify the password (in plain text) to access RTL. This password will be hashed and not stored as plain text.
* `configPath` (optional) - File path of the c-lightning config file, if RTL server is local to the c-lightning server.

```
{
  "port": "3000",
  "SSO": {
    "rtlSSO": 0,
    "rtlCookiePath": "",
    "logoutRedirectLink": ""
  },
  "nodes": [
    {
      "index": 1,
      "lnNode": "c-lightning Testnet # 1",
      "lnImplementation": "CLT",
      "Authentication": {
        "macaroonPath": "<Modify to include the path of the folder with access.macaroon>",
        "configPath": "<Optional - Config file path for c-lightning>"
      },
      "Settings": {
        "flgSidenavOpened": false,
        "flgSidenavPinned": true,
        "menu": "Vertical",
        "menuType": "Regular",
        "theme": "dark-pink",
        "satsToBTC": false,
        "bitcoindConfigPath": "",
        "enableLogging": "true",
        "lnServerUrl": "https://<cl-rest api server ip address>:3001/v1"
      }
    }
    ],
  "multiPass": <password required for accessing RTL>
}
```
### <a name="start"></a>Start the server and access the app
Run the following command:

`$ node rtl`

If the server started successfully, you should get the below output on the console:

`$ Server is up and running, please open the UI at http://localhost:3000`

Open your browser at the following address: http://localhost:3000 to access the RTL app.

### <a name="service"></a>Running c-lightning RTL as a service (RPi or Linux Platform)
In case you are running a headless Rpi or a Linux node, you can configure RTL as a service.

* Create rtl.service systemd unit in and with the following content. Save and exit.
```
[Unit]
Description=RideTheLightning
Requires=c-lightning-REST.service
After=c-lightning-REST.service

[Service]
User=<user>
Group=<user>
Restart=on-failure

ExecStart=/usr/bin/node <Full path to RTL folder>/rtl

StandardInput=null
StandardOutput=syslog
StandardError=syslog

# Hardening measures
PrivateTmp=true
NoNewPrivileges=true
PrivateDevices=true

[Install]
WantedBy=multi-user.target
```

### Detailed config and instructions
For detailed config and access options and other information, view the main readme page.
