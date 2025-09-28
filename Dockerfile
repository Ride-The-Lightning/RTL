ARG BASE_DISTRO="node:20-alpine"

FROM --platform=${BUILDPLATFORM} ${BASE_DISTRO} AS builder

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

RUN npm ci --legacy-peer-deps

COPY . .

# Build the Angular application
RUN npm run buildfrontend

# Build the Backend from typescript server
RUN npm run buildbackend

FROM --platform=${TARGETPLATFORM} ${BASE_DISTRO} AS runner

RUN apk add --no-cache tini

WORKDIR /RTL

COPY --from=builder /RTL/rtl.js ./rtl.js
COPY --from=builder /RTL/package.json ./package.json
COPY --from=builder /RTL/package-lock.json ./package-lock.json
COPY --from=builder /RTL/frontend ./frontend
COPY --from=builder /RTL/backend ./backend

# Runtime dependency installation
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts \
  && npm prune --omit=dev --legacy-peer-deps

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
