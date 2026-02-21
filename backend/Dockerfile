FROM node:22-alpine
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 6500

CMD ["npm", "run", "dev"]
