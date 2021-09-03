FROM node:14-alpine

RUN apk add --no-cache tini

WORKDIR /RTL

COPY package.json /RTL/package.json
COPY pnpm-lock.yaml /RTL/pnpm-lock.yaml

# Install dependencies
RUN pnpm install --production

COPY . /RTL

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "-g", "--"]

CMD ["node", "rtl"]
