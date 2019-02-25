FROM node:10-alpine

RUN apk add --no-cache tini

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY package-lock.json /RTL/package-lock.json

# Install dependencies
RUN npm install

COPY . /RTL

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
