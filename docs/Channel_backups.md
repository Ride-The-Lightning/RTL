### Channel Backups
Static Channel Backup APIs of LND has been leveraged to provide channel backup feature on RTL.

#### Backup folder location
Default location: If no folder location is specified in the RTL conf files (single or mult-node setup), RTL will create a folder `backup` on the RTL root. If multiple nodes are being managed via RTL, multiple node sub-folders will be created in the `backup` folder.

User defined: User can specify the folder where channel backups should be created, by setting a config variable `channelBackupPath` in the `RTL-Config.json` file. Please ensure that RTL has the permission to write in the specified folder location.

Environment variable: Channel backup folder location can also be controlled via an environment variable `CHANNEL_BACKUP_PATH`

#### Backup execution
Channel backups will be taken at the following instances:

- Server startup: RTL will automatically execute all channel backup, everytime the server is started.
- Channel open/close: RTL will automatically execute all channel backup, everytime a new channel is opened or an existing channel is closed.
- Manual backups: A user can also manually execute the backup commands. The menu options are available on the `Backup` page under `Channels`. User can take all channel backups or individual channel backups as well as verify all/individual channel backup files.
