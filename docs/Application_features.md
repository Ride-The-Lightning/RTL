[Intro](../README.md) -- **Application Features** -- [Road Map](Roadmap.md) -- [LND API Coverage](docs/LNDAPICoverage.md) -- [Application Configurations](docs/Application_configurations)

## RTL - Feature List

### Home Page (Dashboard and Node Status)
- Wallet Balance
- Number of Peers connected
- Channel Balance
- Chain Sync status indicator
- Fee Report
- Channel Status
- Channel Balance comparison (aggregate local vs remote)
- Network Info

### Settings
- Current Unit Toggle (Sats to BTC)
- Layout Customization
- Menu Customization
- Theme Skins
- Nav Options

### LND Wallet
#### Send/Receive
- Total Balance
- Confirmed Balance
- Unconfirmed Balance
- Receive Funds, Generate Address (with QR Code)
- Send funds
#### List Transactions
- List of on-chain transactions

### Peers (Manage LN Peers)
- Connect to a peer with the LN Public key and/or IP address
- List of connected peers with alias
- Detach Peer

### Channels
#### Management
- Open Channel with connected peers
- List of channels
- Close channel
- Update Channel (One or All)
#### Pending
- Pending Open Channels (Default)
- Pending Force Closing Channels
- Pending Closing Channels
- Waiting Close
#### Closed
- List of Closed Channels

### Payments
#### List Payments
- List of payments made via node
#### Send Payment
- Verify and Send Payments
- Pay empty invoice with custom amount

### Invoices
- Add Invoice with Optional Memo and Amount and Generate payment request (with QR Code)
- List Invoices

### Forwarding History
- View all the forwarded HTLCs within a date range (default view is past 24 hours)

### Lookups
- Lookup a node details with pubkey
- Lookup a channel details with Channel ID

### Node Config
- Read-only view of Node conf files for lnd and bitcoin
