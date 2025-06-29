
FROM node:23-slim as builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

FROM node:23-slim as runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

CMD ["npm", "run", "start:prod"]
