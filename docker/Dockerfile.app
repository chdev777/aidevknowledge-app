# Vite dev server コンテナ
FROM node:20-bullseye-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app

# pnpm-lock.yaml と package.json を先に COPY して依存キャッシュを効かせる
# 開発時はボリュームマウントするので、初回 pnpm install はコンテナ内で実行
COPY package.json ./

EXPOSE 3000

CMD ["pnpm", "dev"]
