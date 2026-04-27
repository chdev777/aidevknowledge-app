/**
 * 本番Firestoreへの誤接続を検出する safety guard
 *
 * scripts/seed.ts の先頭で必ず実行する。
 * - FIRESTORE_EMULATOR_HOST が未設定 → 本番接続疑い → abort
 * - GCLOUD_PROJECT / FIREBASE_PROJECT_ID が "prod" / "production" を含む → abort
 */

const RED = '\x1b[31m';
const RESET = '\x1b[0m';

export function ensureEmulatorOnly(): void {
  const emulatorHost = process.env['FIRESTORE_EMULATOR_HOST'];
  const authEmulatorHost = process.env['FIREBASE_AUTH_EMULATOR_HOST'];

  if (!emulatorHost) {
    console.error(`${RED}[env-guard] FIRESTORE_EMULATOR_HOST is not set.${RESET}`);
    console.error('seed.ts は Firestore Emulator にしか接続を許可しません。');
    console.error('  例: export FIRESTORE_EMULATOR_HOST=localhost:8080');
    process.exit(1);
  }

  if (!authEmulatorHost) {
    console.error(`${RED}[env-guard] FIREBASE_AUTH_EMULATOR_HOST is not set.${RESET}`);
    process.exit(1);
  }

  const projectId = process.env['GCLOUD_PROJECT'] ?? process.env['FIREBASE_PROJECT_ID'] ?? '';
  if (/prod|production/i.test(projectId)) {
    console.error(`${RED}[env-guard] project id "${projectId}" looks like production. abort.${RESET}`);
    process.exit(1);
  }

  console.log('[env-guard] OK — emulator only');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureEmulatorOnly();
}
