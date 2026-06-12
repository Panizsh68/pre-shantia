# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# برای bcrypt و node-gyp
RUN apk add --no-cache python3 make g++ git

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Run Stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl bash

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]