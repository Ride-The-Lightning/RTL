### Channel Fund Restore from the channel backup files

#### Assumptions
- The node has been restored with a LND's cipher seed mnemonic.
- RTL generated channel backup file/s is available (all channel backup file is `channel-all.bak`).

#### Steps to recover the funds
- Create a `restore` folder in your backup location folder, as specified in the RTL config file.
- Place the channel backup file in the `restore` folder.
- Access the `Restore` page under the `Channels` section of RTL.
- RTL will list the options to restore funds from the all channel file or individual channel backup file.
- Click on the `Restore` button on the grid to restore the funds.
- Once the restore function is executed successfully, RTL will rename the backup file and it will no longer be visible on the page.
- Restore function will force close the channels and recover the funds from them.
- The pending close channels can be viewed on the Pending page under `Channels`.
- The corresponding pending on-chain transactions can also be viewed on the Transactions list under the `On-Chain` page.
- Once the transactions are confirmed, the channels funds will be restored to your LND Wallet.