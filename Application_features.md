[Intro](README.md) -- **Application Features** -- [Road Map](Roadmap.md) -- [LND API Coverage](LNDAPICoverage.md)

## RTL - Feature List

### Home Page (Dashboard and Node Status)
- Wallet Balance
- Number of Peers connected
- Number of Active channels
- Channel Balance
- Chain Sync status indicator
- Fee Report
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
#### Dashboard
- Channel Status - Number of Active, Inactive and Pending channels
- Total Channel Balances - Aggregated balance view for local and remote channels
#### Management
- Open Channel with connected peers
- List of channels
- Close channel
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

### Lookups
- Lookup a node details with pubkey
- Lookup a channel details with Channel ID

### Node Config
- Read-only view of Node conf files for lnd and bitcoin
