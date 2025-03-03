FROM node:23-alpine
WORKDIR /app
# COPY package.json ./
# RUN apk add --no-cache python3 make g++
# RUN npm install
# RUN npm rebuild better-sqlite3 --build-from-source
# COPY *.js ./
COPY . .
# RUN mkdir -p data

# RUN mkdir -p front/public
# COPY front/public/* ./front/public
# CMD ["npm", "run", "dev"]

ENTRYPOINT ["sh", "install.sh"]
