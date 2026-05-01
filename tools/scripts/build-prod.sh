#!/usr/bin/env sh
# 本番ビルド用ラッパ。
#
# 課題:
#   Docker compose の `env_file: - .env` で VITE_* が container env に注入される。
#   Vite の loadEnv は process.env を上書きしないため、.env.production / .env.production.local
#   の値が無視され、開発用 (aidev-knowledge-dev) が成果物に焼き付いてしまう。
#
# 対応:
#   ビルド前に VITE_* を unset し、Vite の loadEnv に委ねる。
#   .env.production（git 管理）+ .env.production.local（gitignore）が source of truth。
set -eu

for var in $(printenv | awk -F= '/^VITE_/{print $1}'); do
  unset "$var"
done

# .env.production.local が無いと API_KEY 等が空のまま焼き付く
if [ ! -f .env.production.local ]; then
  echo "error: .env.production.local が存在しません。Firebase Web 設定を投入してください" >&2
  exit 1
fi

exec pnpm exec vite build --mode production
