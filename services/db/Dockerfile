FROM alpine:3.21

RUN apk update && apk add --no-cache sqlite sqlite-dev
RUN apk add bash

WORKDIR /app/data
VOLUME /app/data

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
