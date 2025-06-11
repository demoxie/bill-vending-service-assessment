FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm ci --legacy-peer-deps --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
