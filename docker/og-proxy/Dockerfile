FROM node:20-alpine

RUN apk add --no-cache ca-certificates \
  && corepack enable \
  && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

COPY package.json ./
RUN pnpm install --prod=false

COPY tsconfig.json ./
COPY src ./src

EXPOSE 8787

CMD ["pnpm", "start"]
