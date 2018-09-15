# RTL - Ride The Lightning

RTL is a web UI for Lightning Network Daemon.

Lightning Network Daemon is an implementation of Lightning Network BOLT protocol by Lightning Labs (https://lightning.engineering/).

Visit their Github repo (https://github.com/lightningnetwork/lnd/blob/master/README.md) for details on Lightning Network and LND implementation.

This UI builds upon the below raspberry pi guide:
https://github.com/Stadicus/guides/blob/master/raspibolt/README.md

## Prerequisites
Please ensure that you have completed the installation of lightning node on your raspberry pi, based on the above guide.

It can be either on testnet or mainnet

## Installation

Fetch sources from the RTL git repository:

`git clone https://github.com/ShahanaFarooqui/RTL.git`

Move into the newly created directory:

`cd RTL`

Fetch the dependencies and build the application by running:

`npm install`

## Execution
Make sure you are in the RTL directory, where the application was built.

Locate the complete path of the readable macroon file on your pi.

If you followed the guide above, it should be `/home/admin/.lnd`.

This path needs to be provided as a command line argument to start the server

## Start the Webserver
Run the following command:

`node rtl --lndir <macaroon-path>` 

For example:
`node rtl --lndir /home/admin/.lnd`

If the server started successfully, you should get the below output on the console:

`Server is up and running, please open the UI at http://localhost:3000`

Open your browser at the following address: http://localhost:3000 to access the RTL application on your pi.
