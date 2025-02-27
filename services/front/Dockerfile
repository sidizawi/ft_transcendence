FROM python:3.12-slim

VOLUME /app
WORKDIR /app
COPY . .
EXPOSE 8000

ENTRYPOINT [ "python3", "-m", "http.server", "8000" ]
