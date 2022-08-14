### Connect to RTL remotely over Tor

This guide will allow you to remotely connect to RTL over Tor. This can work on any platform, the below example is for serving an android and windows client.

#### Server Setup 
Install Tor on the same local machine as RTL. see the tor project wiki [here](https://trac.torproject.org/projects/tor/wiki)
On Debian based distros:
    $> sudo apt install tor

Edit `/etc/tor/torrc` (Debian based distro) configuration file, and add the following lines:
```
HiddenServiceDir /var/lib/tor/rtl-service-v3/
HiddenServiceVersion 3
HiddenServicePort 3000 127.0.0.1:3000
```
Change `/var/lib/tor/rtl-service-v3/` to any directory you want to store the hidden service credentials. 

Save the changes to the `torrc` file and restart tor.
    $> sudo systemctl restart tor
    or sometimes:
    $> sudo systemctl daemon-reload    

View the contents of the file `/var/lib/tor/rtl-service-v3/hostname`. You need to be root. It will show an onion address. This is your address.
On Debian based distro:
    $> su -c "cat /var/lib/tor/rtl-service-v3/hostname"
 
#### Client setup: Android

Install Tor browser (or any other compatible browser) for Android from the app store

Open the tor enabled browser and type in the onion address (example `z1234567890abc.onion:3000`) 
Only you have access to this website! All traffic in the tor enabled browser will go over Tor (which is slower than clearnet). 

#### Client setup: Windows Tor Browser (not updated)

Download and install Tor Browser for windows: https://www.torproject.org/download/

In Windows, edit `"%HOMEDRIVE%%HOMEPATH%"\Desktop\Tor Browser\Browser\TorBrowser\Data\Tor\torrc`

Add the following line. Replace the onion address, password(cookie), and mydevice with your credentials:
```
HidServAuth 1234567890abcdefg.onion abcdef01234567890+/K mydevice
```

Save and exit. 

Now open Tor Browser, type in the `1234567890abcdefg.onion:3000` address!
