# 1) RTL Docker Dev Setup

### This is not suitable for production deployments. ONLY FOR DEVELOPMENT.

This `docker-compose` template launches `bitcoind`, `lnd` and `rtl` containers.

It is configured to run in **regtest** mode but can be modified to suit your needs.

### 1.1) Notes
 - `bitcoind` is built from an Ubuntu repository and should not be used in production.
 - `lnd` will not sync to chain until Bitcoin regtest blocks are generated (see below).
 - `rtl` image is from the Docker Hub repository but you can change this to your needs.
 - Various ports and configs can be adjusted in the `.env` or `docker-compose.yml` files.

## 1.2) How to run
It may take several minutes if containers need to be built. 

1.2.1) From the terminal in this folder:

```
$ docker-compose up -d bitcoind
$ bin/b-cli generate 101
$ docker-compose up -d lnd rtl
```

1.2.2) Check containers are up and running with:
```
$ docker-compose ps
```

1.2.3) Use the cli tools to get responses from the containers:
```
$ bin/ln-cli getinfo
$ bin/b-cli getblockchaininfo
```

1.2.4) View daemon logs as follows:
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
# 2) Stand alone RTL Setup
This is suitable when you already have a LND node running and configured.

## 2.1) From docker image pull
```
RTL_VERSION=0.12.0
docker run --name rtl -d -it \
-e RTL_CONFIG_PATH=/RTLConfig \
-v /path/to/RTLConfig/dir:/RTLConfig \
-v /path/to/macaroon/dir:/path/as/specified/in/RTLConfig \
-v /path/to/database/dir:/RTL/database \
-p 3000:3000/tcp \
shahanafarooqui/rtl:${RTL_VERSION}
```

## 2.2) From local docker build
### 2.2.1) Build the image locally
```
RTL_VERSION=0.12.0
docker build -t rtl:${RTL_VERSION} -f dockerfiles/Dockerfile .
```
### 2.2.2) Create .env file
Create an environment file with your required configurations. Sample .env:
```
RTL_CONFIG_PATH=/RTLConfig
LN_IMPLEMENTATION=LND
MACAROON_PATH=/LNDMacaroon
LN_SERVER_URL=https://host.docker.internal:8080

```

### 2.2.3) Run the newly built image with .env configurations
```
RTL_VERSION=0.12.0
docker run -d -it \
-v /path/to/RTLConfig/dir:/RTLConfig \
-v /path/to/macaroon/dir:/LNDMacaroon \
-v /path/to/database/dir:/RTL/database \
--env-file=.env -p 3000:3000 rtl:${RTL_VERSION}
```

Once the container is running you can access the RTL UI at http://localhost:3000

---
@hashamadeus on Twitter
