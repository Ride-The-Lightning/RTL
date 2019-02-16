FROM node:10-alpine

WORKDIR /RTL

COPY . /RTL

# Install dependencies
RUN npm install

EXPOSE 3000

#Run the app server
ENTRYPOINT ["node", "rtl"]
