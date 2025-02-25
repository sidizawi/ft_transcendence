FROM alpine:3.21

RUN apk update && apk add --no-cache sqlite sqlite-dev

WORKDIR /data
VOLUME /data

RUN sqlite3 /data/transcendence.db "PRAGMA journal_mode=WAL;"

ENTRYPOINT [ "sh", "-c", "sqlite3 /data/transcendence.db & tail -f /dev/null" ]
