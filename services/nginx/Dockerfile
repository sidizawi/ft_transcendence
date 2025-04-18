FROM nginx:1.27.2-alpine-slim

RUN apk add openssl
RUN mkdir -p /etc/nginx/ssl && \
    mkdir -p /etc/nginx/ssl/private && \
    mkdir -p /etc/nginx/ssl/certs

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout /etc/nginx/ssl/private/nginx-selfsigned.key \
		-out /etc/nginx/ssl/certs/nginx-selfsigned.crt \
		-subj "/C=BE/ST=Brussels/L=Brussels/O=Organization/OU=Unit/CN=commonname"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

RUN chmod -R 755 /etc/nginx/ssl/private/nginx-selfsigned.key && \
    chmod -R 755 /etc/nginx/ssl/certs/nginx-selfsigned.crt


CMD [ "nginx", "-g", "daemon off;" ]
# CMD [ "sleep" , "infinity" ]