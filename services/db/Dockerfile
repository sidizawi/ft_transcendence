# FROM alpine:3.21
FROM node:23-alpine

RUN apk update && apk add --no-cache sqlite sqlite-dev
RUN apk add bash

WORKDIR /app/data
VOLUME /app/data

COPY entrypoint.sh /entrypoint.sh
COPY init.sh /init.sh
RUN chmod +x /entrypoint.sh /init.sh

RUN bash /entrypoint.sh

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .

ENTRYPOINT [ "npm", "run", "dev" ]

# ENTRYPOINT ["/entrypoint.sh"]
