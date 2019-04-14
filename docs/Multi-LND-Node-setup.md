#### Directions for setting up RTL to connect with and manage multiple LND nodes

Caution: This feature is for advanced users, running multiple LND nodes.

A single server instance of RTL can be used to connect with multiple LND nodes on the same network. Configuring RTL for this requires the following steps:
1. Update lnd.conf of LND to enable remote connections and restart LND
2. Configure 'RTL-Multi-Node-Conf.json' with individual entries for each LND node
3. Restart RTL
4. Run RTL and switch LND nodes live via settings

##### 1. Update lnd.conf
This step is required to configure the nodes, which will be remotely connected with RTL.
1. A static IP address must be assigned to the device running LND
2. admin.macaroon for this node must be transferred to the device on which you need to run RTL
3. Add this setting your lnd.conf file under the [Application Options] section: `restlisten=<ip address of the device running LND>:8080`
4. Restart LND


##### 2. Configure 'RTL-Multi-Node-Conf.json'

##### 3. Restart RTL

##### 4. Run RTL and switch LND nodes in the UI
