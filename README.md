[ **Intro** ] -- [ [Application Features](Application_features.md) ]
-----
# RTL - Ride The Lightning

RTL is a web UI for Lightning Network Daemon.

Lightning Network Daemon is an implementation of Lightning Network BOLT protocol by Lightning Labs (https://lightning.engineering/).

Visit their Github repo (https://github.com/lightningnetwork/lnd/blob/master/README.md) for details on Lightning Network and LND implementation.

For setting up your Lightning Network node, you can follow the below guide:
https://github.com/Stadicus/guides/blob/master/raspibolt/README.md

## Prerequisites
Please ensure that you have completed the installation of LND lightning node.

Its recommended to run this application on testnet, untill the aplha testing phase is over.

Recommended Browsers: Chrome, Chromium (rpi), MS Edge.

## Installation

Fetch sources from the RTL git repository, by executing the below command at the command prompt:

`$ git clone https://github.com/ShahanaFarooqui/RTL.git`

Move to the newly created directory:

`$ cd RTL`

Fetch the dependencies and build the application by running:

`$ npm install`

## Execution
Make sure you are in the RTL directory, where the application was built.

Locate the complete path of the readable macroon file (admin.macroon) on your node.

If you followed the guide above, and your on lnd version 0.4.2 or below it should be `/home/admin/.lnd`.
For lnd version 0.5 it should be `/home/admin/.lnd/data/chain/bitcoin/testnet`.

Other platform users should accordingly locate the directory of the readable macroon file.

The path of the macroon directory needs to be provided as a command line argument to start the server.

## Start the Webserver
Run the following command:

`node rtl --lndir <macaroon-path>` 

For example:
`$ node rtl --lndir /home/admin/.lnd`

or

`$ node rtl --lndir /home/admin/.lnd/data/chain/bitcoin/testnet`

or (for windows)

`$ node rtl --lndir C:\Users\<your user directory>\AppData\Local\Lnd\data\chain\bitcoin\testnet`

If the server started successfully, you should get the below output on the console:

`Server is up and running, please open the UI at http://localhost:3000`

### Optional: Running RTL as a service (rpi or Linux platform users)
In case you are running a headless rpi or Linux node, you can configure RTL as a service.

* Create RTL systemd unit and with the following content. Save and exit.

`# Raspibolt RTL: systemd unit for RTL`

`# /etc/systemd/system/RTL.service`

[Unit]

Description=RTL daemon

Wants=lnd.service

After=lnd.service

[Service]

ExecStart=/usr/bin/node /home/admin/Projects/RTL/rtl --lndir /home/admin/.lnd/data/chain/bitcoin/testnet/

User=root

Restart=always

TimeoutSec=120

RestartSec=30

[Install]

WantedBy=multi-user.target


* enable and start RTL

`$ sudo systemctl enable RTL`

`$ sudo systemctl start RTL`

* montior the RTL log file in realtime(exit with Ctrl-C)

`$ sudo jounrnalctl -f -u RTL`

## Accessing the Application

You can access the application in two ways:
### Same computer as the webserver
Open your browser at the following address: http://localhost:3000 to access the RTL application.

### Remotely from another computer on the same local network as the node
To access the application remotely from a computer, ensure that the firewall running on your node allows access on port 3000.
You would need the IP address of your node to access the application.

E.g. if the IP address of your node is 192.168.0.15 then open your browser at the following address: http://192.168.0.15:3000 to access RTL.
