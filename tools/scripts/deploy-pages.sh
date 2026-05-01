#!/usr/bin/env sh
# Cloudflare Pages 本番デプロイスクリプト。
#
# 使い方（ホストから）:
#   export CLOUDFLARE_API_TOKEN=$(cat cloudflare/og-worker/.env.local | grep CLOUDFLARE_API_TOKEN | cut -d= -f2)
#   docker compose exec -T -e CLOUDFLARE_API_TOKEN app tools/scripts/deploy-pages.sh           # production
#   docker compose exec -T -e CLOUDFLARE_API_TOKEN app tools/scripts/deploy-pages.sh preview   # preview branch
#   docker compose exec -T -e CLOUDFLARE_API_TOKEN app tools/scripts/deploy-pages.sh --dry-run # ビルドのみ
#
# 注意:
#   - Worker と同じ Cloudflare アカウント（ipc-claudeapps001）を使う
#   - Pages プロジェクトは初回のみ自動作成される（または事前に dashboard で作成済み）
#   - .env.production.local の Firebase Web 設定が必須
set -eu

PROJECT_NAME="${PAGES_PROJECT_NAME:-aidev-knowledge-hub}"
DEPLOY_DIR="${DEPLOY_DIR:-dist}"
MODE="${1:-production}"

case "$MODE" in
  --dry-run|dry-run)
    echo "[deploy-pages] dry-run: ビルドのみ実行（デプロイなし）"
    pnpm build:prod
    echo "[deploy-pages] dist/ 内容:"
    ls -la "$DEPLOY_DIR" | head -20
    exit 0
    ;;
  preview)
    BRANCH_FLAG="--branch=preview"
    ;;
  production|prod|"")
    # Cloudflare Pages では --branch=main がプロダクション扱い（プロジェクト設定に依存）
    BRANCH_FLAG="--branch=main"
    ;;
  *)
    echo "error: unknown mode '$MODE' (production|preview|--dry-run)" >&2
    exit 1
    ;;
esac

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "error: CLOUDFLARE_API_TOKEN が未設定です" >&2
  exit 1
fi

echo "[deploy-pages] 本番ビルド実行..."
pnpm build:prod

echo "[deploy-pages] Cloudflare Pages へデプロイ: project=$PROJECT_NAME mode=$MODE"
cd cloudflare/og-worker
pnpm exec wrangler pages deploy "../../$DEPLOY_DIR" \
  --project-name="$PROJECT_NAME" \
  $BRANCH_FLAG \
  --commit-dirty=true
