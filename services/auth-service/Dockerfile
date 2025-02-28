FROM node:23-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# RUN mkdir -p data

# RUN mkdir -p front/public
# COPY front/public/* ./front/public
# CMD ["npm", "run", "dev"]
ENTRYPOINT ["npm", "run", "dev"]
