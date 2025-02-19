FROM node:22-alpine

WORKDIR /app

COPY package* ./

RUN npm install

RUN mkdir -p data

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
