ARG BASE_DISTRO="node:24-alpine"
# node:24-alpine publishes no 32-bit ARM (arm/v7) image, so 32-bit ARM builds and runs on
# node:22-alpine, which is supported until April 2027.
ARG ARM32_BASE_DISTRO="node:22-alpine"

# Pick the base for each architecture: the builder by the platform the build runs on (a native
# build on a 32-bit ARM board builds there), the runner by the platform the image is for.
FROM --platform=${BUILDPLATFORM} ${BASE_DISTRO} AS build-base-amd64
FROM --platform=${BUILDPLATFORM} ${BASE_DISTRO} AS build-base-arm64
FROM --platform=${BUILDPLATFORM} ${ARM32_BASE_DISTRO} AS build-base-arm
FROM ${BASE_DISTRO} AS run-base-amd64
FROM ${BASE_DISTRO} AS run-base-arm64
FROM ${ARM32_BASE_DISTRO} AS run-base-arm

FROM build-base-${BUILDARCH} AS builder

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

RUN npm ci --legacy-peer-deps

COPY . .

# Build the Angular application
RUN npm run buildfrontend

# Build the Backend from typescript server
RUN npm run buildbackend

# Remove non production necessary modules
RUN npm prune --omit=dev --legacy-peer-deps

FROM run-base-${TARGETARCH} AS runner

# Upgrade the Alpine packages inherited from the base image, so a build picks up
# fixes (such as a refreshed ca-certificates bundle) before the base tag is rebuilt.
RUN apk add --no-cache tini && apk upgrade --no-cache

WORKDIR /RTL

COPY --from=builder /RTL/rtl.js ./rtl.js
COPY --from=builder /RTL/package.json ./package.json
COPY --from=builder /RTL/frontend ./frontend
COPY --from=builder /RTL/backend ./backend
COPY --from=builder /RTL/node_modules/ ./node_modules

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
