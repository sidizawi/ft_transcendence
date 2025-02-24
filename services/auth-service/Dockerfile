FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# RUN mkdir -p front/public
# COPY front/public/* ./front/public
CMD ["npm", "run", "dev"]
