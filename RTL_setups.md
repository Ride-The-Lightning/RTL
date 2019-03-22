### Documenting the different RTL setups and the corresponding config tweaks

#### RTL+LND running on the same device

#### RTL and LND running on different devices (Local LAN)
If your running RTL and LND on different devices on your local LAN, certain config changes need to be made in LND and RTL conf files.
1. A static IP address must be assigned to the device running LND
2. `admin.macaroon` file must be transferred to the device on which you need to run RTL
3. Add to your lnd.conf file under the [Application Options] section: `restlisten=<ip address of the device running LND>:8080`
4. Restart LND
5. Make the following changes to the RTL.conf file
```
[Authentication]
macaroonPath=<Path of the folder containing 'admin.macaroon' on the device running RTL>
nodeAuthType=CUSTOM
rtlPass=<password in plain text>
[Settings]
lndServerUrl=https://<ip-address-of-device-running-lnd>:8080/v1
```
6. Restart RTL
