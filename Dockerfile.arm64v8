FROM node:10-jessie-slim AS builder

ADD https://github.com/krallin/tini/releases/download/v0.18.0/tini-static-armel /tini
ADD https://github.com/krallin/tini/releases/download/v0.18.0/tini-static-armel.asc /tini.asc
RUN apt-get install gnupg
RUN gpg --batch --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 595E85A6B1B4779EA4DAAEC70B588DFF0527A9B7 \
 && gpg --batch --verify /tini.asc /tini
RUN chmod +x /tini

WORKDIR /RTL

COPY . /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

# Install dependencies
RUN npm install

COPY . /RTL

FROM arm32v7/node:10-jessie-slim

WORKDIR /RTL

COPY --from=builder "/RTL" .
COPY --from=builder "/tini" /sbin/tini

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
