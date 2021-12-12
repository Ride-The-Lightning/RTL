[Intro](../README.md) -- **Application Features** -- [Road Map](Roadmap.md) -- [Application Configurations](Application_configurations)

## RTL - Feature List

### Home Page - Operator
- General node information
- On-Chain and Lightning balances
- Channel capacity with Local-Remote balances and Balance score
- Routing fee earned and transactions routed
- Channel status for Active, Pending, Inactive and Closing channels

### Home Page - Merchant
- On-Chain and Lightning balances
- Inbound Channel capacity
- Outbound Channel capacity
- Receive and Pay Lightning transactions

### On-Chain
- Total, Confirmed and Unconfirmed balances in Sats, BTC and Fiat
- Receive Funds, Generate Address (with QR Code)
- Send funds
- Sweep all funds {LND only}
- List of on-chain transactions {LND only}
- Export transaction list to csv

### Lightning
#### Peers/Channels
- Peer management (Connect, disconnect with network peers)
- Open channel
- Close channel
- Update channel fee policy
- Circular Rebalance {LND only}
- Open, Pending and Closed channel list
- Export all lists to csv

#### Transactions
- Make payments
- Invoice generation
- Query routes

#### Routing
- Forwarding history
- Routing peers summary {LND only}

#### Graph Lookup
- Lookup a node details with pubkey
- Lookup a channel details with Channel ID

#### Sign/Verify
- Sign a message with node's private key and generate a signature
- Verify the message with a signature to determine the pubkey of the node used to sign

#### Loop - Optional Feature {LND only}
- Loop Out for gaining Inbound channel capacity
- Loop In for replenishing Outbound capacity
- Loop Out and In transactions list

#### Backup {LND only}
- All channel backup and verify
- Individual channel backup and verify
- Folder location of the backup files

### Network {LND only}
- Network information from the graph

### Settings
- Fiat conversion toggle
- Default node setting for multiple nodes
- Toggle for Persona switch to change the dashboard layout
- Day-Night mode toggle
- Themes for color customizations

### Help
- Basic In-product documentation

### Public Key
- Display the node pubkey along with a QR code
- Display the node URI along with a QR code