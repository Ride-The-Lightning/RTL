### Setup https access for RTL

Forward the ports 80 and 3002 on the router to the device running RTL.
Allow the ports through the firewall of the device.

Install, if needed, openssl
On Debian based distros:
    $> sudo apt install openssl

Create a self certificate with openssl
    $> openssl req -newkey rsa:4096 -x509 -sha512 -days 365 -nodes -out /path/to/some/folder/rtl-cert.crt -keyout /path/to/some/folder/rtl-cert.key 
    
#### Nginx

Install Nginx:
https://www.nginx.com/resources/wiki/start/topics/tutorials/install/
On Debian based distros:
    $> sudo apt install nginx

nginx default config file is at /etc/nginx/nginx.conf. You will need it.

Sample configuration to be inserted in the nginx.conf (adjust the path and filename of your certificate and key):

    stream {
            upstream RTL {
                    server 127.0.0.1:3000;
            }

            server {
                    listen 3002 ssl;
                    proxy_pass RTL;

                    ssl_certificate /path/to/some/folder/rtl-cert.crt;
                    ssl_certificate_key /path/to/some/folder/rtl-cert.key;
                    ssl_session_cache shared:SSL:1m;
                    ssl_session_timeout 4h;
                    ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # this line works for me with only TLSv1.2
                    ssl_prefer_server_ciphers on;
            }
    }

Restart Nginx with the new configuration and connect to RTL over https on the port 3002.
On Debian based distros:
    $> sudo systemctl restart nginx

#### Apache2

Skip to step 5 if you already have Apache2 set up with HTTPS configured.

1. Install [Apache2](https://httpd.apache.org/download.cgi)
    - On Debian-based distros: `sudo apt install apache2`
    - On Fedora-based distros: `sudo yum install httpd`
2. Install [Let's Encrypt](https://letsencrypt.org) to get a free TLS certificate. The easiest way to install is to use Snap: `sudo snap install certbot`.
3. Run `certbot` to get a Let's Encrypt certificate: `sudo certbot`. Follow the instructions given to validate your domain name and install the certificate only. You may choose to redirect HTTP traffic to HTTPS instead (which attempts to secure every connection even when the client device does not request it). Let's Encrypt does not issue certificates for IP addresses. if you don't have a domain name, but you can use a service like NoIP.
4. Locate the Let's Encrypt Apache2 configuration file. It's usually in `/etc/apache2/sites-enabled` and called "000-default-le-ssl.conf" or similar.
5. Add the following lines to the Apache2 configuration file between the VIrtualHost 443 tags. This will redirect Apache's document root on your webserver to instead point to RTL. Change "/" to something like "/rtl" if you would instead like to redirect "/rtl" to RTL and do something else at the document root. Change "3002" to whatever port number you are using if it is not 3002.

    ProxyPass "/" "http://127.0.0.1:3002/rtl"
    ProxyPassReverse "/" "http://127.0.0.1:3002/rtl"

6. Restart Apache2.
    - Debian-based distros: `sudo systemctl restart apache2`
    - Fedora-based distros: `sudo systemctl restart httpd`
7. (Option) Edit ~/.rtl/rtl.js to disable insercure HTTP access to RTL entirely. Find these lines:

    if (common.host) {
      server.listen(common.port, common.host);
    } else {
      server.listen(common.port);
    }

...and change them to:

    if (common.host) {
      server.listen(common.port, "127.0.0.1");
    } else {
      server.listen(common.port, "127.0.0.1");
    }

This disables normal HTTP access to your server except if the client is on the same machine as the server. This will allow you to access http://localhost:3002 (or whatever port number you are using) on a browser that is on the same machine as RTL, but otherwise, you will have to access RTL through the Apache2 reverse proxy at https://yourdomain.tld/rtl, which will secure the connection with HTTPS.

Note: Occasionally you will receive "Invalid CSRF token, form tempered" when attempting to log in to RTL. If that happens, refresh the page and try again.
