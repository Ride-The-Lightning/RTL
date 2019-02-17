<a href="https://snyk.io/test/github/ShahanaFarooqui/RTL"><img src="https://snyk.io/test/github/ShahanaFarooqui/RTL/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/ShahanaFarooqui/RTL" style="max-width:100%;"></a>

**Intro** -- [Application Features](Application_features.md) -- [Road Map](Roadmap.md) -- [LND API Coverage](LNDAPICoverage.md)

## RTL - Ride The Lightning

* [Introduction](#intro)

# <a name="intro"></a>Introduction
RTL is a web UI for Lightning Network Daemon.

Lightning Network Daemon is an implementation of Lightning Network BOLT protocol by Lightning Labs (https://lightning.engineering/).

Visit their Github repo (https://github.com/lightningnetwork/lnd/blob/master/README.md) for details on Lightning Network and LND implementation.

For setting up your Lightning Network node on a Raspberry Pi, you can follow the below guide:

https://github.com/Stadicus/guides/blob/master/raspibolt/README.md

RTL source code is available at the below repo:

https://github.com/ShahanaFarooqui/RTLFullApplication

For Screenshots and UI operation guide you can visit the below medium post:

https://medium.com/@suheb.khan/how-to-ride-the-lightning-447af999dcd2

### Prerequisites
Please ensure that you have completed the installation of LND lightning node.

Its recommended to run this application on testnet, untill the aplha testing phase is over.

The application also requires Node.js, which can be downloaded from the below location:

https://nodejs.org/en/download/

Recommended Browsers: Chrome, Firefox, MS Edge

### Installation

#### First time setup
Fetch sources from the RTL git repository, by executing the below command at the command prompt:

`$ git clone https://github.com/ShahanaFarooqui/RTL.git`

Move to the newly created directory:

`$ cd RTL`

Fetch the dependencies and build the application by running:

`$ npm install`

#### Updating existing build
`$ cd RTL`

Reset Git (for the changes you may have made to the config file).

Warning: This step will revert the UI settings, you may have changed on RTL (We will address this in future revisions).

`$ git reset --hard HEAD`

`$ git clean -f -d`

`$ git pull`

`$ npm install`

### Prep for Execution
Make sure you are in the RTL directory, where the application was built.

RTL requires a config file `RTL.conf` to start the server and provide user authentication for the app.

Locate the complete path of the readable macroon file (admin.macroon) on your node and lnd.conf file

If you followed Stacidus's guide referenced above, and you are on lnd version 0.4.2 or below it should be `/home/admin/.lnd`.

For lnd versions 0.5 and above, it should be `/home/admin/.lnd/data/chain/bitcoin/testnet`.

Other platform users should accordingly locate the directory of the readable macroon and lnd.conf files.

The path of the macroon directory and lnd.conf needs to be provided in the RTL.conf file to start the server.

Sample RTL.conf:
```
[Authentication]
lndServerUrl=https://localhost:8080/v1
macroonPath=C:\Users\<User>\AppData\Local\Lnd\data\chain\bitcoin\testnet
nodeAuthType=DEFAULT
lndConfigPath=C:\Users\<User>\AppData\Local\Lnd\lnd.conf
[Settings]
flgSidenavOpened=true
flgSidenavPinned=true
menu=Vertical
menuType=Regular
theme=dark-blue
satsToBTC=false
```

#### User Authentication on RTL
Basic user authentication has now been added on RTL. This requires user to login to RTL server first, before accessing LND functions.
There are two options to configure authentication on RTL, depending on the `nodeAuthtype` value provided in RTL.conf.

For `nodeAuthType=DEFAULT`
Password provided in lnd.conf for the rpc setting for bitcoind will be used for authentication.

For `nodeAuthType=CUSTOM`
Specific password can be provided in RTL.conf, to be used by RTL for authentication.
Password should be set with `rtlPass=<user defined>` in the [Authentication] section of RTL.conf

### Start the Webserver
Run the following command:

`node rtl` 

If the server started successfully, you should get the below output on the console:

`Server is up and running, please open the UI at http://localhost:3000`

#### Optional: Running RTL as a service (rpi or Linux platform users)
In case you are running a headless rpi or Linux node, you can configure RTL as a service.

* Create RTL systemd unit and with the following content. Save and exit.
```bash
# Raspibolt RTL: systemd unit for RTL
# /etc/systemd/system/RTL.service

[Unit]
Description=RTL daemon
Wants=lnd.service
After=lnd.service

[Service]
ExecStart=/usr/bin/node /home/admin/Projects/RTL/rtl
User=<user>
Restart=always
TimeoutSec=120
RestartSec=30

[Install]
WantedBy=multi-user.target
```

* enable and start RTL

`$ sudo systemctl enable RTL`

`$ sudo systemctl start RTL`

* montior the RTL log file in realtime(exit with Ctrl-C)

`$ sudo journalctl -f -u RTL`

### Accessing the Application

You can access the application in two ways:
#### Same computer as the webserver
Open your browser at the following address: http://localhost:3000 to access the RTL application.

#### Remotely from another computer on the same local network as the node
To access the application remotely from a computer, ensure that the firewall running on your node allows access on port 3000.
You would need the IP address of your node to access the application.

E.g. if the IP address of your node is 192.168.0.15 then open your browser at the following address: http://192.168.0.15:3000 to access RTL.

### Troubleshooting
Feel free to open issues on our github, in case you are running into issues with the application.
You can also reach out via twitter DM @Sauby_k. Thanks.
