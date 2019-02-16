FROM node:10-alpine

RUN apk add --no-cache tini

WORKDIR /RTL

COPY . /RTL

# Install dependencies
RUN npm install

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
