FROM node:18

WORKDIR /beti_task

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# CMD ["npm", "start"]