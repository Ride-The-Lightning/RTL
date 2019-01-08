[Intro](README.md) -- **[Application Features]** -- [Road Map](Roadmap.md) -- [LND API Coverage](LNDAPICoverage.md)

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

### LND Wallet (Wallet functions available on LND)
- Total Balance
- Confirmed Balance
- Unconfirmed Balance
- Generate Address (with QR Code)
- Send funds

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

### Payments
#### List Payments
- List of payments made via node
#### Send Payment
- Verify and Send Payments

### Invoices
- Add Invoice with Optional Memo and Amount and Generate payment request
- List Invoices

### Node Config
- Read-only view of Node conf files for lnd and bitcoin
