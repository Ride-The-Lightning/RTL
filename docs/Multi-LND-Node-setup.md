#### Directions for setting up RTL to connect with and manage multiple LND nodes

Caution: This feature is for advanced users, running multiple LND nodes.

A single server instance of RTL can be used to connect with multiple LND nodes on the same network. Configuring RTL for this requires the following steps:
1. Update lnd.conf of LND to enable remote connections and restart LND
2. Configure 'RTL-Multi-Node-Conf.json' with individual entries for each LND node
3. Restart RTL
4. Run RTL and switch LND nodes live via settings

##### Update lnd.conf

##### Configure 'RTL-Multi-Node-Conf.json'

##### Restart RTL

##### Run RTL and switch LND nodes in the UI
