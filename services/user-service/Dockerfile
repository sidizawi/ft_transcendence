FROM node:23-alpine
WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN mkdir -p ./database/avatars

# CMD ["npm", "run", "dev"]
ENTRYPOINT ["npm", "run", "dev"]

