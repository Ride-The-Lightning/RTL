# ---------------
# Install Dependencies
# ---------------
FROM node:14.15-alpine as deps

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

RUN npm install

# ---------------
# Build App
# ---------------
FROM deps as build

WORKDIR /RTL

# Build the Angular application
COPY . .

RUN npm run build

# Remove non production necessary modules
RUN npm prune --production

# ---------------
# Release App
# ---------------
FROM node:14.15-alpine

WORKDIR /RTL

RUN apk add --no-cache tini

COPY . /RTL
COPY --from=build /app/angular ./angular
COPY --from=build /app/node_modules/ ./node_modules

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
