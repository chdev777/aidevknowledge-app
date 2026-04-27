#!/bin/sh
# MinIO 初期化スクリプト
# - bucket 作成
# - 認証必須の bucket policy 設定
set -eu

ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
BUCKET="${MINIO_BUCKET:-aidev-uploads}"

echo "[minio-init] waiting for MinIO at ${ENDPOINT}..."
until mc alias set local "${ENDPOINT}" "${ROOT_USER}" "${ROOT_PASSWORD}" >/dev/null 2>&1; do
  sleep 1
done
echo "[minio-init] MinIO is ready"

if mc ls "local/${BUCKET}" >/dev/null 2>&1; then
  echo "[minio-init] bucket '${BUCKET}' already exists"
else
  echo "[minio-init] creating bucket '${BUCKET}'"
  mc mb "local/${BUCKET}"
fi

# CORS（dev用、Vite 3000 からの直接アクセスはしない設計だが念のため）
cat <<'JSON' > /tmp/cors.json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 600
    }
  ]
}
JSON

# 公開バケットにはしない（署名付きURL経由のみアクセス可）
echo "[minio-init] bucket policy: private (signed URL only)"
mc anonymous set none "local/${BUCKET}" || true

echo "[minio-init] done"
