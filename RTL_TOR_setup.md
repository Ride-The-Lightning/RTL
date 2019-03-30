### Conect to RTL remotely over Tor

Install Tor for your platform, on the same local machine as RTL. see the tor project wiki [here](https://trac.torproject.org/projects/tor/wiki)

Edit the `torrc` configuration file, and add the following lines:
```
HiddenServiceDir /var/db/tor/rtl/
HiddenServiceVersion 2
HiddenServiceAuthorizeClient stealth mydevice
HiddenServicePort 3000 127.0.0.1:3000
```
Change `/var/db/tor/rtl/` to any directory you want to store the hidden service credentials. 
Change `mydevice` to anything you want. 

Save the changes to the `torrc` file and restart tor.

View the contents of the file `/var/db/tor/rtl/hostname`. It will show an onion address, an authentication password(cookie), and the accociated `mydevice` label.

Download Orbot for android (add their repos to F-Droid here: https://guardianproject.info/fdroid/)

Open orbot. Click the `⋮`, select `hidden services ˃`, select `Client cookies`.

Press the + button on the lower right. Type in the the onion address and secret cookie you revealed in file `/var/lnd/tor/rtl/hostname`.

Go back to orbot's main screen, and select the gear icon under `tor enabled apps`. 
Add your favorite tor compatible browser (I use brave) `Brave`, then press back. 
Click `stop` on the big onion logo. Exit orbot and reopen it. 
Turn on `VPN Mode`. Start your connection to the tor network by clicking on the big onion (if it has not automatically connected already)

Now open the tor enabled browser and type in the onion address (example `z1234567890abc.onion:3000`) 
Only you have access to this website! All traffic in the brave browser will go over Tor (which is slower than clearnet). 
To go back to clearnet browsing, turn off VPN mode in Orbot.
