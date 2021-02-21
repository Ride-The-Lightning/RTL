### Directions for setting up RTL to connect with and manage multiple nodes

Caution: This feature is for advanced users, running multiple nodes.

A single server instance of RTL can now be used to connect with multiple nodes on the same network. Multi-Node configuration requires the following:
1. In case of LND node implementation, update lnd.conf for the node to enable remote connections and restart LND
2. Configure 'RTL-Config.json' with individual entries for each node
3. Restart RTL
4. Run RTL and switch nodes live via dropdown on the menubar

#### 1. Update lnd.conf
This step is only required to configure the nodes, which will be remotely connected with RTL.
1. A static IP address must be assigned to the device running LND
2. `admin.macaroon` for this node must be transferred to the device on which you need to run RTL
3. Add this setting your lnd.conf file under the [Application Options] section: `restlisten=<ip address of the device running LND>:8080`
4. Restart LND

#### 2. Configure 'RTL-Config.json'
1. Rename the `sample-RTL-Config.json` on the root RTL location to `RTL-Config.json`
2. Set `multiPass` to the preferred password. This password will be used to authenticate the user for RTL. Once authenticated, the user will be able to access all the nodes configured in the json file
3. Set the `port` to the preferred port number over which to run RTL
4. Set the `defaultNodeIndex` to configure the default start up node at server restart
5. `SSO` section can be used for single-sign-on from applications like BTCPayserver. If using RTL as a stand-alone app to connect with the nodes, keep the `rtlSSO=0` and ignore the rest of `SSO` section.
6. `nodes` section is a json array, with each element of the array representing the specific parameters for the LND node to connect with. `index` must be a number and start with 1. This number must be unique for each node in the array. For each element, two items need to be configured for each node on the network (`macaroonPath` and `lnServerUrl`).
7. `macaroonPath` should be set to the local path of the folder containing `admin.macaroon` file for each node. Each node must have a different folder for the `admin.macaroon` on the RTL server.
8. `swapMacaroonPath` should be set to the local path of the folder containing `loop.macaroon` file for loop.
9. `boltzMacaroonPath` should be set to the local path of the folder containing `admin.macaroon` file for boltz swaps.
10. `lnServerUrl` must be set to the service url for LND/C Lightining REST APIs for each node, with the unique ip address of the node hosting lnd/clightning e.g. https://192.168.0.1:8080 OR https://192.168.0.1:3001. In this case the ip address of the node hosting lnd/clightning is '192.168.0.1'
11. `swapServerUrl` must be set to the swap service url. e.g. https://localhost:8081.
12. `boltzServerUrl` must be set to the boltz service url. e.g. https://localhost:9003.
13. `configPath` and `bitcoindConfigPath` are optional parameters which can be set only if the RTL is running locally on the same node. Else it can be set to "" or removed from the conf file all together.
14. `lnApiPassword` is mandatory in the ln implementation is ECL and configPath is missing. It is used to provide password for API authentication. It will be ignored in other ln implementations.

#### 3. Restart RTL

#### 4. Run RTL and switch nodes in the UI
The application should be accessed, with the ip and port combination, as earlier. The user needs to enter the password set with the `multiPass` variable to authenticate. Once authenticated, the application will load the node with index configured with `defaultNodeIndex`. The other nodes configured with the file, can be accessed via the dropdown in the side menu.

Thats all for now.
The application is currently designed for a simple setup to access and manage multiple nodes.
More features like an advanced multi-node dashboard can be developed in the future, depending upon the interest from the community.
