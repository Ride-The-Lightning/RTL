FROM node:18-alpine as base

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

RUN npm install --legacy-peer-deps

COPY . .

# Build the Angular application
RUN npm run buildfrontend

# Build the Backend from typescript server
RUN npm run buildbackend

# Remove non production necessary modules
RUN npm prune --omit=dev --legacy-peer-deps

FROM arm32v7/node:18-alpine as runner-arm32v7

ADD https://github.com/krallin/tini/releases/download/v0.19.0/tini-static-armel /tini
ADD https://github.com/krallin/tini/releases/download/v0.19.0/tini-static-armel.asc /tini.asc
RUN chmod +x /tini

WORKDIR /RTL

COPY --from=base /RTL/rtl.js ./rtl.js
COPY --from=base /RTL/package.json ./package.json
COPY --from=base /RTL/frontend ./frontend
COPY --from=base /RTL/backend ./backend
COPY --from=base /RTL/node_modules/ ./node_modules
COPY --from=base /tini /sbin/tini

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]

FROM arm64v8/node:18-alpine as runner-arm64v8

ADD https://github.com/krallin/tini/releases/download/v0.19.0/tini-static-arm64 /tini
RUN chmod +x /tini

WORKDIR /RTL

COPY --from=base /RTL/rtl.js ./rtl.js
COPY --from=base /RTL/package.json ./package.json
COPY --from=base /RTL/frontend ./frontend
COPY --from=base /RTL/backend ./backend
COPY --from=base /RTL/node_modules/ ./node_modules
COPY --from=base /tini /sbin/tini

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]

FROM node:18-alpine as runner-amd64

RUN apk add --no-cache tini

WORKDIR /RTL

COPY --from=base /RTL/rtl.js ./rtl.js
COPY --from=base /RTL/package.json ./package.json
COPY --from=base /RTL/frontend ./frontend
COPY --from=base /RTL/backend ./backend
COPY --from=base /RTL/node_modules/ ./node_modules

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
