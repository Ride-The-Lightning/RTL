FROM node:16-alpine

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

# Install dependencies
RUN apk add --no-cache g++ git jq make python3 sqlite sqlite-dev \
  && NODE_SQLITE_VERSION=4.2.0 \
  && npm un sqlite3 -S \
  && npm i --production \
  && wget https://github.com/mapbox/node-sqlite3/archive/refs/tags/v${NODE_SQLITE_VERSION}.zip -O /opt/sqlite3.zip \
  && mkdir -p /opt/sqlite3 \
  && unzip /opt/sqlite3.zip -d /opt/sqlite3 \
  && cd /opt/sqlite3/node-sqlite3-${NODE_SQLITE_VERSION} \
  && npm install \
  && ./node_modules/.bin/node-pre-gyp install --fallback-to-build --build-from-source --sqlite=/usr/bin --python=/usr/bin/python3 \
  && mv /opt/sqlite3/node-sqlite3-${NODE_SQLITE_VERSION} /opt/app/node_modules/sqlite3 \
  && apk del g++ git jq make python3 \
  && rm -Rf /opt/sqlite3 /opt/sqlite3.zip

COPY angular/ /RTL/angular/
COPY backend/ /RTL/backend/
COPY rtl.js /RTL/rtl.js

EXPOSE 3000

CMD ["node", "rtl"]
