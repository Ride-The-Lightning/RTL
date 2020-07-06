![](../screenshots/RTL-ECL-Dashboard.png)

## RTL Eclair setup

* [Introduction](#intro)
* [Pre-requisite](#prereq)
* [Architecture](#arch)
* [Installation](#install)
* [Prep for execution](#prep)
* [Start the server and access the app](#start)

### <a name="intro"></a>Introduction
RTL is now enabled to manage an Eclair node.

Follow the below steps to install and setup RTL to run on Eclair.

### <a name="prereq"></a>Pre-requisites:
1. Functioning Eclair node
2. NodeJS - Can be downloaded [here](https://nodejs.org/en/download)

### <a name="arch"></a>Architecture
![](../screenshots/RTL-ECL-Arch-2.png)

### <a name="install"></a>Installation:
#### First time setup
* Fetch sources from RTL git repository, by executing the below on the command prompt:

`$ git clone https://github.com/Ride-The-Lightning/RTL.git`
* Change directory to RTL folder:

`$ cd RTL`

* Fetch the production dependencies by running:
`$ npm install --only=prod`

#### Or: Update existing build
```
$ cd RTL
$ git reset --hard HEAD
$ git clean -f -d
$ git pull
$ npm install --only=prod
```
### <a name="prep"></a>Prep for Execution
RTL requires its own config file `RTL-Config.json`, to start the server and provide user authentication on the app. 
* Rename `sample-RTL-Config.json` file to `RTL-Config.json`.
* Locate the complete path of the readable `eclair.conf` for your node.
* Modify the RTL conf file per the example file below

Ensure that the follow values are correct per your config:
* `lnImplementation` - This should be `ECL`, indicating that RTL is connecting to an Eclair node.
* `lnServerUrl` - complete url with ip address and port of the eclair server.
* `multiPass` - Specify the password (in plain text) to access RTL. This password will be hashed and not stored as plain text.
* `configPath` (Mandatory) - Full path of the folder containing `eclair.conf` including the file name for the basic password authentication through `eclair.api.password`.

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
      "lnNode": "Eclair Testnet # 1",
      "lnImplementation": "ECL",
      "Authentication": {
        "configPath": "<Mandatory - Config file path, including .conf file, for authentication>"
      },
      "Settings": {
        "userPersona": "OPERATOR",
        "themeMode": "DAY",
        "themeColor": "PURPLE",
        "bitcoindConfigPath": "",
        "enableLogging": true,
        "fiatConversion": false,
        "lnServerUrl": "http://<eclair api server ip address>:port"
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

### Detailed config and instructions
For detailed config and access options and other information, view the main readme page.
