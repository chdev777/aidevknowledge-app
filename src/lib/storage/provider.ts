/**
 * Storage Provider 抽象化
 *
 * PoC（MinIO）と本番（Firebase Storage）の差分を吸収する。
 * 共通インターフェース：署名URLを発行 → クライアントが直接 PUT/GET。
 *
 * MinIO の鍵は SPA に渡さず、必ず og-proxy の sign endpoint 経由で取得する。
 */

export type StorageKind = 'avatar' | 'link-thumb' | 'note-attachment' | 'app-thumb';

export interface UploadCredentials {
  /** Storage 内部キー（Firestoreドキュメントに保存する識別子） */
  key: string;
  /** クライアントが PUT する先の署名付きURL */
  url: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  fields?: Record<string, string>;
}

export interface UploadOpts {
  kind: StorageKind;
  ext: string;
  contentType: string;
  /** kind が note-attachment / link-thumb / app-thumb の場合は必須 */
  targetId?: string;
  /** 進捗コールバック */
  onProgress?: (loaded: number, total: number) => void;
}

export interface StorageProvider {
  /**
   * アップロード用の署名URLを取得
   */
  prepareUpload(opts: UploadOpts): Promise<UploadCredentials>;

  /**
   * 署名済み PUT URL に実際にファイルをアップロード
   * 戻り値は Storage キー（Firestore に保存する値）
   */
  upload(file: File, opts: UploadOpts): Promise<string>;

  /**
   * Storage キーから表示用の URL を解決
   */
  getDownloadUrl(key: string): Promise<string>;

  /**
   * オブジェクトを削除
   */
  delete(key: string): Promise<void>;
}
