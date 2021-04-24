# RTL Docker Dev Setup

### This is not suitable for production deployments. ONLY FOR DEVELOPMENT.

This `docker-compose` template launches `bitcoind`, `lnd` and `rtl` containers.

It is configured to run in **regtest** mode but can be modified to suit your needs.

### Notes
 - `bitcoind` is built from an Ubuntu repository and should not be used in production.
 - `lnd` will not sync to chain until Bitcoin regtest blocks are generated (see below).
 - `rtl` image is from the Docker Hub repository but you can change this to your needs.
 - Various ports and configs can be adjusted in the `.env` or `docker-compose.yml` files.

## How to run
It may take several minutes if containers need to be built. From the terminal in this folder:

```
$ docker-compose up -d bitcoind
$ bin/b-cli generate 101
$ docker-compose up -d lnd rtl
```

Check containers are up and running with:
```
$ docker-compose ps
```

Use the cli tools to get responses from the containers:
```
$ bin/ln-cli getinfo
$ bin/b-cli getblockchaininfo
```

View daemon logs as follows:
```
$ docker-compose logs bitcoind lnd rtl
```

Once the containers are running you can access the RTL UI at http://localhost:3000

 - Default password is `password`.
 - Default host, port and password can be changed in `.env`.

When you are done you can destroy containers with:
```
$ docker-compose down -v
```

---
@hashamadeus on Twitter
