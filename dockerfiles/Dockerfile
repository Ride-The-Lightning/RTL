# ---------------
# Install Dependencies
# ---------------
FROM node:16-alpine as deps

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

RUN npm install

# ---------------
# Build App
# ---------------
FROM deps as build

WORKDIR /RTL

COPY . .

# Build the Angular application
RUN npm run buildapp

# Build the Backend from typescript server
RUN npm run buildbackend

# Remove non production necessary modules
RUN npm prune --production

# ---------------
# Release App
# ---------------
FROM node:16-alpine

WORKDIR /RTL

RUN apk add --no-cache tini

COPY --from=build /app/rtl.js ./rtl.js
COPY --from=build /app/angular ./angular
COPY --from=build /app/backend ./backend
COPY --from=build /app/node_modules/ ./node_modules

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
