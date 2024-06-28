ARG BASE_DISTRO="node:alpine"

FROM --platform=${BUILDPLATFORM} ${BASE_DISTRO} as builder

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

FROM --platform=${TARGETPLATFORM} ${BASE_DISTRO} as runner

RUN apk add --no-cache tini

WORKDIR /RTL

COPY --from=builder /RTL/rtl.js ./rtl.js
COPY --from=builder /RTL/package.json ./package.json
COPY --from=builder /RTL/frontend ./frontend
COPY --from=builder /RTL/backend ./backend
COPY --from=builder /RTL/node_modules/ ./node_modules

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
