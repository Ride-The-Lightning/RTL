### Setup https access for RTL

Forward the ports 80 and 3002 on the router to the device running RTL.
Allow the ports through the firewall of the device.

Install Nginx:
https://www.nginx.com/resources/wiki/start/topics/tutorials/install/
On Debian based distros:
    $> sudo apt install nginx

nginx default config file is at /etc/nginx/nginx.conf. You will need it.

Install, if needed, openssl
On Debian based distros:
    $> sudo apt install openssl

Create a self certificate with openssl
    $> openssl req -newkey rsa:4096 -x509 -sha512 -days 365 -nodes -out /path/to/some/folder/rtl-cert.crt -keyout /path/to/some/folder/rtl-cert.key 


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
