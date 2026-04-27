import { useAuth } from '../../lib/firebase/auth-context.js';
import { PageHeader } from '../../components/shared/PageHeader.js';

export function AdminPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === '管理者';

  return (
    <div className="page">
      <PageHeader
        eyebrow="08 · ADMIN"
        title="管理"
        subtitle="ユーザー・タグ・投稿の管理。"
      />

      <div
        style={{
          padding: 60,
          textAlign: 'center',
          color: 'var(--ink-3)',
          border: '1px dashed var(--line)',
          borderRadius: 12,
          margin: '20px 0',
        }}
      >
        {isAdmin ? (
          <>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
              管理機能は Phase 2 で実装予定です。
            </div>
            <div style={{ fontSize: 12 }}>
              （ユーザー一覧 / ロール変更 / タグマスタ管理 / 投稿モデレーション）
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
              管理者権限が必要なセクションです。
            </div>
            <div style={{ fontSize: 12 }}>
              現在のロール: {profile?.role ?? '不明'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
