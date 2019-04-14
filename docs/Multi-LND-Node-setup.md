### Directions for setting up RTL to connect with and manage multiple LND nodes

Caution: This feature is for advanced users, running multiple LND nodes.

A single server instance of RTL can now be used to connect with multiple LND nodes on the same network. Multi-Node configuration requires the following:
1. Update lnd.conf for the LND nodes to enable remote connections and restart LND
2. Configure 'RTL-Multi-Node-Conf.json' with individual entries for each LND node
3. Restart RTL
4. Run RTL and switch LND nodes live via settings

#### 1. Update lnd.conf
This step is required to configure the nodes, which will be remotely connected with RTL.
1. A static IP address must be assigned to the device running LND
2. `admin.macaroon` for this node must be transferred to the device on which you need to run RTL
3. Add this setting your lnd.conf file under the [Application Options] section: `restlisten=<ip address of the device running LND>:8080`
4. Restart LND

#### 2. Configure 'RTL-Multi-Node-Conf.json'
1. Rename the `sample-RTL-Multi-Node-Conf.json` on the root RTL location to `RTL-Multi-Node-Conf.json`
2. Set `multiPass` to the preferred password. This password will be used to authenticate the user for RTL. Once authenticated, the user will be able to access all the nodes configured in the json file
3. Set the `port` to the preferred port number over which to run RTL
4. `SSO` section can be used for single-sign-on from applications like BTCPayserver. If using RTL as a stand-alone app to connect with the nodes, keep the `rtlSSO=0` and ignore the rest of `SSO` section.
5. `nodes` section is a json array, with each element of the array representing the specific parameters for the LND node to connect with. `index` must be a number and start with 1. This number must be unique for each node in the array. For each element, two items need to be configured for each unique node on the network (`macaroonPath` and `lndServerUrl`).
6. `macaroonPath` should be set to the local path of the folder containing `admin.macaroon` file for each node. Each node must have a different folder for the `admin.macaroon` on the RTL server.
7. `lndServerUrl` must be set to the service url for LND REST APIs for each node, with the unique ip address of the node hosting lnd e.g. https://192.168.0.1:8080/v1. In this case the ip address of the node hosting lnd is '192.168.0.1'
8. `lndConfigPath` and `bitcoindConfigPath` are optional parameters which can be set only if the RTL is running locally on the same node. Else it can be set to "" or removed from the conf file all together.

#### 3. Restart RTL

#### 4. Run RTL and switch LND nodes in the UI
The application should be accessed, with the ip and port combination, as earlier. The user needs to enter the password set with the `multiPass` variable to authenticate. Once authenticated, the application will load the node with index value 1 by default. The other nodes configured with the file, can be accessed via the settings menu. Settings menu is opened by the gear icon on the right side of the app.

Upon opening up the settings menu, the list of available nodes can be found under `Switch Nodes` label. Choose the preferred nodes from the drop-down to switch.

Thats all for now.
The application is currently designed for a simple setup to access and manage multiple nodes.
More features like an advanced multi-node dashboard can be developed in the future, depending on the interest from the community.
