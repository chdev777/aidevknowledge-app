// ===============================
// Mock data — AI App Dev Knowledge Hub
// ===============================

window.MOCK = (() => {
  const users = [
    { id: "u1", name: "佐藤 健一", handle: "sato.k", role: "DX推進", color: "#b08968" },
    { id: "u2", name: "松岡 真理", handle: "matsuoka.m", role: "情報支援", color: "#7a8b6f" },
    { id: "u3", name: "木村 亮介", handle: "kimura.r", role: "DX推進", color: "#6b7a99" },
    { id: "u4", name: "田辺 美咲", handle: "tanabe.m", role: "情報支援", color: "#a07a7a" },
    { id: "u5", name: "管理者", handle: "admin", role: "管理者", color: "#5a5a5a" },
  ];

  const tags = [
    { id: "t1", name: "RAG", type: "技術", count: 18 },
    { id: "t2", name: "ベクトルDB", type: "技術", count: 7 },
    { id: "t3", name: "Function Calling", type: "技術", count: 4 },
    { id: "t4", name: "Agents", type: "技術", count: 6 },
    { id: "t5", name: "OCR", type: "技術", count: 3 },
    { id: "t6", name: "Dify", type: "ツール", count: 14 },
    { id: "t7", name: "LangChain", type: "ツール", count: 9 },
    { id: "t8", name: "LlamaIndex", type: "ツール", count: 5 },
    { id: "t9", name: "OpenAI API", type: "ツール", count: 12 },
    { id: "t10", name: "Claude", type: "ツール", count: 8 },
    { id: "t11", name: "Gemini", type: "ツール", count: 5 },
    { id: "t12", name: "Next.js", type: "開発", count: 11 },
    { id: "t13", name: "Python", type: "開発", count: 10 },
    { id: "t14", name: "FastAPI", type: "開発", count: 4 },
    { id: "t15", name: "PostgreSQL", type: "開発", count: 6 },
    { id: "t16", name: "Docker", type: "開発", count: 3 },
    { id: "t17", name: "FAQ検索", type: "用途", count: 7 },
    { id: "t18", name: "議事録要約", type: "用途", count: 6 },
    { id: "t19", name: "文書検索", type: "用途", count: 5 },
    { id: "t20", name: "研修資料", type: "用途", count: 2 },
    { id: "t21", name: "個人情報", type: "セキュリティ", count: 4 },
    { id: "t22", name: "認証", type: "セキュリティ", count: 5 },
    { id: "t23", name: "プロンプトインジェクション", type: "セキュリティ", count: 3 },
  ];

  const projects = [
    { id: "p1", name: "学内FAQ検索アプリ", description: "学内規程・手続きに関する問合せを自動応答", color: "#b08968", status: "利用中", owner: "u1", links: 12, questions: 4, notes: 8, apps: 2 },
    { id: "p2", name: "議事録要約アプリ", description: "会議音声から要点・決定事項・ToDoを抽出", color: "#7a8b6f", status: "検証中", owner: "u2", links: 9, questions: 3, notes: 6, apps: 1 },
    { id: "p3", name: "問い合わせ分類AI", description: "入電内容を部署別に自動分類", color: "#6b7a99", status: "試作", owner: "u3", links: 5, questions: 2, notes: 3, apps: 1 },
    { id: "p4", name: "業務マニュアル検索AI", description: "社内マニュアルPDFを横断検索", color: "#a07a7a", status: "検証中", owner: "u2", links: 7, questions: 2, notes: 4, apps: 1 },
    { id: "p5", name: "研修資料作成支援アプリ", description: "新人研修のスライド素案を生成", color: "#8a7ab0", status: "試作", owner: "u4", links: 3, questions: 1, notes: 2, apps: 0 },
    { id: "p6", name: "文書要約アプリ", description: "長文レポートの要約生成", color: "#b0a078", status: "改善中", owner: "u1", links: 6, questions: 2, notes: 3, apps: 1 },
  ];

  const links = [
    {
      id: "l1",
      title: "RAG設計の失敗例 ─ チャンクサイズと埋め込みの落とし穴",
      url: "https://youtube.com/watch?v=example-rag-01",
      sourceType: "YouTube",
      domain: "youtube.com",
      summary: "RAGを実装する際に陥りがちな5つの失敗パターンを、実際のログとメトリクスを交えて解説。チャンクサイズ、オーバーラップ、埋め込みモデルの選択がRecall@Kに与える影響を定量的に検証している。",
      userComment: "うちのFAQ検索でチャンク512→256に下げたら精度が逆に落ちた件、この動画の3章で全く同じ失敗例が出てきた。チャンクサイズは小さければ良いわけではない。",
      importance: "高",
      status: "検証済み",
      tags: ["t1", "t17"],
      project: "p1",
      author: "u1",
      createdAt: "2026-04-22T10:15:00",
      thumbnailAccent: "#b08968",
    },
    {
      id: "l2",
      title: "OpenAI DevDay 2026 — Responses API と新Agentsフレームワーク",
      url: "https://x.com/openai/status/example-001",
      sourceType: "X",
      domain: "x.com",
      summary: "DevDay基調講演のスレッド。従来のChat Completions/Assistants APIが Responses API に統合され、ツール呼び出しとストリーミングが簡素化。新Agentsフレームワークはマルチステップ推論を標準装備。",
      userComment: "問い合わせ分類AIを作り直すならこの新API前提で考えたい。既存のAssistants実装は段階的に移行必要。",
      importance: "高",
      status: "確認中",
      tags: ["t9", "t4"],
      project: "p3",
      author: "u3",
      createdAt: "2026-04-21T18:42:00",
      thumbnailAccent: "#6b7a99",
    },
    {
      id: "l3",
      title: "PDF RAG Starter — 表組みと図版を含むPDFの前処理サンプル",
      url: "https://github.com/example/pdf-rag-starter",
      sourceType: "GitHub",
      domain: "github.com",
      summary: "表組みをMarkdownに、図版を画像キャプション化してからチャンク化する前処理パイプライン。Unstructured + LlamaParse + pgvectorの組み合わせ。スター 2.1k、Python 3.11対応。",
      userComment: "業務マニュアル検索AIの前処理がまさに課題だった。このリポジトリのsplitter.py が参考になる。ライセンスはMIT。",
      importance: "高",
      status: "採用候補",
      tags: ["t1", "t5", "t8", "t15"],
      project: "p4",
      author: "u2",
      createdAt: "2026-04-20T14:05:00",
      thumbnailAccent: "#7a8b6f",
    },
    {
      id: "l4",
      title: "Difyでのワークフロー設計パターン集（公式ブログ）",
      url: "https://docs.dify.ai/blog/workflow-patterns-2026",
      sourceType: "公式Docs",
      domain: "docs.dify.ai",
      summary: "Difyのワークフローノードを用いた設計パターン12種類。分岐、並列、リトライ、人間レビュー挿入などのテンプレートをJSONエクスポート付きで公開。",
      userComment: "議事録要約アプリでリトライと人間レビュー挿入パターンが使えそう。テンプレの import は手動確認推奨。",
      importance: "中",
      status: "検証済み",
      tags: ["t6", "t18"],
      project: "p2",
      author: "u2",
      createdAt: "2026-04-19T09:30:00",
      thumbnailAccent: "#b08968",
    },
    {
      id: "l5",
      title: "社内AI導入におけるプロンプトインジェクション対策の実例",
      url: "https://example-tech-blog.jp/security/prompt-injection-2026",
      sourceType: "記事",
      domain: "example-tech-blog.jp",
      summary: "社内ドキュメント検索AIで発生した実際のインジェクション事例と、システムプロンプト分離／入力サニタイズ／出力フィルタリングの3層防御の実装例。",
      userComment: "学内FAQの前にこれは通しで読んでおきたい。特に2章の『検索結果に混入した悪意ある指示』は想定外だった。",
      importance: "高",
      status: "確認中",
      tags: ["t23", "t22"],
      project: "p1",
      author: "u4",
      createdAt: "2026-04-18T16:20:00",
      thumbnailAccent: "#a07a7a",
    },
    {
      id: "l6",
      title: "pgvector vs Pinecone vs Weaviate — 中小規模でのベンチマーク",
      url: "https://example-bench.dev/vectordb-bench-2026",
      sourceType: "記事",
      domain: "example-bench.dev",
      summary: "10万〜100万ベクトル規模での検索レイテンシ、インデックス構築時間、運用コストの比較。pgvector 0.7 の HNSW 実装が想像以上に健闘。",
      userComment: "学内規模（〜50万チャンク）ならpgvectorで十分という結論。既存PostgreSQLに載せられるのが運用上大きい。",
      importance: "中",
      status: "検証済み",
      tags: ["t2", "t15"],
      project: null,
      author: "u2",
      createdAt: "2026-04-17T11:00:00",
      thumbnailAccent: "#7a8b6f",
    },
    {
      id: "l7",
      title: "Claude 3.5 Sonnet の長文要約での挙動メモ",
      url: "https://x.com/example-eng/status/claude-summary",
      sourceType: "X",
      domain: "x.com",
      summary: "200kコンテキストでの議事録要約タスクで、冒頭と末尾の情報を拾いやすく中盤を取りこぼす傾向があるという観察。",
      userComment: "議事録要約アプリで同じ傾向を観測。分割要約＋統合のほうが安定する理由がこれで説明できる。",
      importance: "中",
      status: "検証中",
      tags: ["t10", "t18"],
      project: "p2",
      author: "u1",
      createdAt: "2026-04-16T13:45:00",
      thumbnailAccent: "#6b7a99",
    },
    {
      id: "l8",
      title: "LangChain Expression Language (LCEL) 完全ガイド",
      url: "https://docs.langchain.com/lcel",
      sourceType: "公式Docs",
      domain: "docs.langchain.com",
      summary: "LCELを使ったチェーン構築、並列実行、ストリーミング、フォールバックの実装パターン。",
      userComment: "Difyが使えない要件でコード実装するときのベースとして。",
      importance: "低",
      status: "保留",
      tags: ["t7", "t13"],
      project: null,
      author: "u3",
      createdAt: "2026-04-15T10:00:00",
      thumbnailAccent: "#8a7ab0",
    },
  ];

  const questions = [
    {
      id: "q1",
      title: "RAGでPDFを扱うときの適切なチャンクサイズは？",
      body: "学内規程PDFを対象にFAQ検索アプリを構築中。チャンクサイズを512/256/1024で比較したが、結果が安定しない。文書の性質によって最適値が変わるのは理解しているが、業務文書全般での目安や、可変チャンク戦略の採用基準を知りたい。",
      tags: ["t1", "t17", "t5"],
      project: "p1",
      status: "回答あり",
      author: "u1",
      createdAt: "2026-04-22T09:00:00",
      answers: 3,
      views: 47,
    },
    {
      id: "q2",
      title: "DifyとLangChainはどう使い分けるべきか",
      body: "ノーコード/ローコードで素早く検証したいケースと、きめ細かい制御が必要なケース。現在両方触っているが、チーム内での切り分け基準を整理したい。運用フェーズでの保守性も含めて。",
      tags: ["t6", "t7"],
      project: null,
      status: "回答あり",
      author: "u3",
      createdAt: "2026-04-21T14:30:00",
      answers: 4,
      views: 82,
    },
    {
      id: "q3",
      title: "学内認証（SAML）とAIアプリをどう連携するか",
      body: "NextAuth + 既存SAML IdPで実装予定。ユーザー識別子をAI側のログに残すべきか、どの粒度でアクセス制御すべきか、先行事例があれば共有いただきたい。",
      tags: ["t22"],
      project: "p1",
      status: "未回答",
      author: "u4",
      createdAt: "2026-04-21T10:15:00",
      answers: 0,
      views: 12,
    },
    {
      id: "q4",
      title: "YouTube動画を要約してナレッジ化する仕組みの構成案",
      body: "社内勉強会の録画をナレッジ化したい。字幕APIから全文取得→要約→タグ付けの流れを想定。著作権と、本人音声の取り扱いについても判断基準が欲しい。",
      tags: ["t18", "t21"],
      project: null,
      status: "未回答",
      author: "u1",
      createdAt: "2026-04-20T17:00:00",
      answers: 0,
      views: 8,
    },
    {
      id: "q5",
      title: "外部API利用時のレート制限とリトライ戦略",
      body: "OpenAI / Claude の両方を併用している。429発生時のバックオフ設計、モデルフォールバック、キャッシュ戦略の実装例を募集。",
      tags: ["t9", "t10"],
      project: null,
      status: "回答あり",
      author: "u2",
      createdAt: "2026-04-19T13:20:00",
      answers: 2,
      views: 34,
    },
    {
      id: "q6",
      title: "議事録要約で話者分離精度が伸びない",
      body: "Whisperベースで話者分離しているが、短い発話と相槌で誤分割が多い。前処理か後処理か、どちらに手を入れるのが効果的か。",
      tags: ["t18"],
      project: "p2",
      status: "未回答",
      author: "u2",
      createdAt: "2026-04-18T11:40:00",
      answers: 1,
      views: 19,
    },
  ];

  const answersByQ = {
    q1: [
      {
        id: "a1",
        author: "u2",
        createdAt: "2026-04-22T11:15:00",
        body: "結論から言うと、業務文書では 400〜600 トークン + 15% オーバーラップが出発点として無難でした。学内規程のように章・条ごとに意味が完結する文書であれば、文字数ではなく構造（見出し単位）で切るほうが Recall が安定します。\n\nうちでは (1) 見出しパース → (2) 見出し内で 500 トークン超過時だけ文単位で分割、という2段階方式に落ち着いています。",
        votes: 7,
        accepted: true,
      },
      {
        id: "a2",
        author: "u3",
        createdAt: "2026-04-22T13:00:00",
        body: "可変チャンクの採用基準ですが、①文書の平均段落長が400トークン超える、②見出し構造が明確、のどちらかを満たすなら構造ベースに寄せる判断でいいと思います。固定512で破綻するのは、表や図キャプションを巻き込むケースです。",
        votes: 4,
        accepted: false,
      },
      {
        id: "a3",
        author: "u1",
        createdAt: "2026-04-22T15:30:00",
        body: "補足。l3 の pdf-rag-starter の splitter.py が参考になります。表を Markdown 化してから文字数カウントする実装で、こちらに寄せる方向で検証中。",
        votes: 2,
        accepted: false,
      },
    ],
    q2: [
      { id: "a4", author: "u2", createdAt: "2026-04-21T15:10:00", body: "POC・デモまでは Dify、本番運用と複雑な分岐・ツール統合はコード（LangChain or 自前）という二軸で整理しています。Dify は監査ログと権限管理が要件に合わないケースがあるので、そこが切り分け基準になりがちです。", votes: 8, accepted: true },
      { id: "a5", author: "u4", createdAt: "2026-04-21T16:20:00", body: "保守性観点では、Dify はワークフロー JSON を Git 管理する仕組みが弱い。差分レビューしたいならコード寄せが無難。", votes: 5, accepted: false },
      { id: "a6", author: "u1", createdAt: "2026-04-21T17:45:00", body: "チームスキル依存も大きい要素。ノンエンジニアを巻き込むなら Dify 一択のケースもあります。", votes: 3, accepted: false },
      { id: "a7", author: "u3", createdAt: "2026-04-22T09:00:00", body: "追加。Dify のバージョンアップで破壊的変更が入ることがあるので、長期運用する場合はバージョン固定とアップグレードテストを入れることを推奨。", votes: 2, accepted: false },
    ],
    q5: [
      { id: "a8", author: "u3", createdAt: "2026-04-19T14:30:00", body: "Exponential backoff + jitter (base 1s, max 30s, 最大5回) を基本にしています。429 の retry-after ヘッダが返る場合はそれを優先。", votes: 4, accepted: true },
      { id: "a9", author: "u1", createdAt: "2026-04-19T16:00:00", body: "モデルフォールバックは、精度より可用性を優先するエンドポイントでだけ有効化。要約や分類は OK、回答生成はそのままエラー返すほうがユーザー混乱が少ない。", votes: 3, accepted: false },
    ],
    q6: [
      { id: "a10", author: "u4", createdAt: "2026-04-18T14:00:00", body: "前処理で無音区間（300ms以上）を検出してセグメント境界にすると、相槌混入がかなり減りました。librosa で簡単に書けます。", votes: 2, accepted: false },
    ],
  };

  const notes = [
    {
      id: "n1",
      title: "DifyでFAQ検索アプリを試作",
      purpose: "Difyのナレッジ機能だけで、学内FAQの最小版を構築可能か確認する",
      tried: "学内規程PDF 23件を知識ベースに登録。チャンク 500 / オーバーラップ 50。埋め込みモデル text-embedding-3-small。プロンプトテンプレートは標準のまま。質問 15 件でRecall@3を測定。",
      result: "Recall@3 = 73%。失敗パターンは、(1) 章をまたぐ複合質問、(2) 表中の数値参照、(3) 略語（「DX」等）の曖昧さ。特に (2) は表が画像化されたPDFで壊滅的。",
      conclusion: "MVPとしては十分使える水準。本番投入前に、(a) 表の事前Markdown化、(b) 略語辞書の追加、(c) ハイブリッド検索の導入 を検討。Difyの標準機能だけでは (a) が難しいため、前処理パイプラインは別立てで。",
      tags: ["t6", "t1", "t17"],
      project: "p1",
      author: "u2",
      createdAt: "2026-04-21T16:00:00",
      relatedLinks: ["l1", "l3", "l6"],
    },
    {
      id: "n2",
      title: "議事録要約アプリのプロンプト比較 (5パターン)",
      purpose: "同一議事録に対して、プロンプト構成が要約品質にどの程度影響するか定量評価",
      tried: "30分×3件の会議文字起こしに対し、(1) 単純要約、(2) 決定事項抽出型、(3) ToDo抽出型、(4) 時系列型、(5) ハイブリッド を適用。評価軸は網羅性／正確性／可読性を3名で5段階評価。",
      result: "ハイブリッド（決定事項＋ToDo＋時系列の3セクション構成）が全軸で最高点。単純要約は可読性は高いが網羅性が低い。決定事項抽出型は正確性が高いが文脈を落としがち。",
      conclusion: "出力テンプレートを3セクション固定に決定。プロンプトを v2 として確定し、定型化する。次は話者分離精度の改善へ。",
      tags: ["t18", "t10"],
      project: "p2",
      author: "u2",
      createdAt: "2026-04-20T11:30:00",
      relatedLinks: ["l4", "l7"],
    },
    {
      id: "n3",
      title: "pgvector 0.7 への移行検証",
      purpose: "既存 0.5.1 環境から 0.7 へ移行し、HNSW インデックスの実用性を確認",
      tried: "ステージング環境で 82万ベクトル (1536次元) をHNSWで再インデックス。m=16, ef_construction=64。既存 IVFFlat との検索精度・レイテンシを比較。",
      result: "検索レイテンシ p50: 28ms → 9ms、p95: 120ms → 31ms。インデックス構築時間は 8分 → 22分で増加したが許容範囲。Recall@10 は 0.89 → 0.94 に改善。",
      conclusion: "移行メリット明確。次スプリントで本番反映予定。ダウンタイム回避のため CONCURRENTLY オプションで構築する運用手順を確定。",
      tags: ["t2", "t15"],
      project: "p4",
      author: "u2",
      createdAt: "2026-04-18T15:45:00",
      relatedLinks: ["l6"],
    },
    {
      id: "n4",
      title: "Claude 3.5 Sonnet と GPT-4o の分類タスク比較",
      purpose: "問い合わせ分類AI で採用するモデルを決定するためのコンペ",
      tried: "過去3ヶ月の問い合わせ 500 件を教師データ化し、10カテゴリ分類を両モデルで実行。同一プロンプト、temperature 0。",
      result: "Accuracy: Claude 0.91 / GPT-4o 0.89。レイテンシは GPT-4o 優位。コストは Claude 優位。誤分類パターンは両者で似ているが、曖昧なケースで Claude がより保守的（「その他」に寄せる）。",
      conclusion: "運用上は「その他」に寄せてくれる Claude を採用。閾値を設けて人間エスカレーションに流す設計に適合。",
      tags: ["t10", "t9"],
      project: "p3",
      author: "u3",
      createdAt: "2026-04-17T10:00:00",
      relatedLinks: ["l2"],
    },
    {
      id: "n5",
      title: "プロンプトインジェクション耐性の簡易テスト",
      purpose: "学内FAQアプリのリリース前セキュリティチェック",
      tried: "OWASP LLM Top 10 と社内で収集した攻撃パターン計 42 件を自動テスト化。システムプロンプト漏洩、権限昇格、他ユーザー情報取得を試行。",
      result: "初期版で 8 件が通過（システムプロンプト一部漏洩 5 件、検索結果経由の指示注入 3 件）。出力フィルタ＋検索結果サニタイズ追加後、全件ブロック。",
      conclusion: "継続的にテストケースを追加していく仕組みが必要。CI に組み込み予定。",
      tags: ["t23", "t22", "t17"],
      project: "p1",
      author: "u4",
      createdAt: "2026-04-16T09:15:00",
      relatedLinks: ["l5"],
    },
  ];

  const apps = [
    {
      id: "app1",
      name: "議事録要約アプリ",
      url: "https://apps.internal.example/meeting-summary",
      summary: "会議の録音ファイルをアップロードすると、3セクション構成（決定事項／ToDo／時系列）で要約を生成。話者分離・タイムスタンプ対応。",
      purpose: "週次定例・プロジェクト会議の議事録作成工数を削減し、参加者以外にも共有可能にする。",
      technologies: ["Dify", "Whisper", "Next.js", "PostgreSQL"],
      aiModel: "Claude 3.5 Sonnet",
      usageScope: "情報支援グループ内",
      status: "検証中",
      caution: "機密度B以上の会議は入力不可。音声ファイルは24時間で自動削除。",
      author: "u2",
      createdAt: "2026-04-15T14:00:00",
      project: "p2",
      tags: ["t18", "t6", "t10"],
      stats: { views: 142, comments: 8, likes: 12 },
    },
    {
      id: "app2",
      name: "学内FAQ検索アプリ",
      url: "https://apps.internal.example/faq-search",
      summary: "学内規程・手続きに関する問い合わせに、規程原文を引用しながら回答。出典リンク必須表示。",
      purpose: "問い合わせ窓口への定型問合せを削減し、担当者が判断業務に集中できるようにする。",
      technologies: ["Next.js", "FastAPI", "pgvector", "Python"],
      aiModel: "GPT-4o mini + text-embedding-3-small",
      usageScope: "DX推進・情報支援",
      status: "試作",
      caution: "出典確認必須。個人情報を含む質問は弾く設計。正確性は 100% ではない旨の明示を徹底。",
      author: "u1",
      createdAt: "2026-04-12T11:20:00",
      project: "p1",
      tags: ["t17", "t1", "t9"],
      stats: { views: 98, comments: 11, likes: 9 },
    },
    {
      id: "app3",
      name: "問い合わせ分類AI",
      url: "https://apps.internal.example/ticket-classify",
      summary: "受信したメール・フォームを 10 カテゴリに自動分類し、担当部署を推定。信頼度が閾値未満は人手レビューに回す。",
      purpose: "問い合わせの一次振り分け工数削減。担当者の対応遅延を低減する。",
      technologies: ["FastAPI", "Python", "PostgreSQL"],
      aiModel: "Claude 3.5 Sonnet",
      usageScope: "関係者限定（β）",
      status: "試作",
      caution: "誤分類率 9%。必ず人手レビューのフローと併用すること。",
      author: "u3",
      createdAt: "2026-04-10T09:00:00",
      project: "p3",
      tags: ["t10"],
      stats: { views: 67, comments: 5, likes: 6 },
    },
    {
      id: "app4",
      name: "業務マニュアル検索AI",
      url: "https://apps.internal.example/manual-search",
      summary: "業務マニュアルPDF群を横断検索。表組み・図版を含むPDFにも対応した前処理パイプライン付き。",
      purpose: "新人が業務手順を自己解決できるようにする。マニュアル参照工数を削減。",
      technologies: ["Next.js", "Python", "pgvector", "Unstructured"],
      aiModel: "GPT-4o + text-embedding-3-large",
      usageScope: "情報支援グループ内",
      status: "検証中",
      caution: "マニュアル改訂時の再インデックス運用要確認。",
      author: "u2",
      createdAt: "2026-04-08T16:00:00",
      project: "p4",
      tags: ["t19", "t1", "t5"],
      stats: { views: 54, comments: 4, likes: 4 },
    },
    {
      id: "app5",
      name: "文書要約アプリ",
      url: "https://apps.internal.example/doc-summary",
      summary: "長文レポート・論文PDFを、要約粒度を3段階で指定して要約生成。",
      purpose: "会議前の資料読み込み時間を短縮。",
      technologies: ["Dify", "Next.js"],
      aiModel: "Claude 3.5 Sonnet",
      usageScope: "DX推進グループ内",
      status: "改善中",
      caution: "数値・固有名詞の抜け漏れあり。原文確認必須。",
      author: "u1",
      createdAt: "2026-04-03T10:00:00",
      project: "p6",
      tags: ["t18", "t6"],
      stats: { views: 41, comments: 3, likes: 3 },
    },
  ];

  const commentsByApp = {
    app1: [
      { id: "c1", author: "u1", type: "感想", createdAt: "2026-04-22T10:00:00", body: "3セクション構成のフォーマットが非常に見やすい。決定事項だけ抜き出す機能があると、週次レポに直接貼れて便利。" },
      { id: "c2", author: "u3", type: "改善提案", createdAt: "2026-04-21T16:30:00", body: "話者名の手動補正UIが欲しい。現状は誤分離した話者を直す導線がない。" },
      { id: "c3", author: "u4", type: "セキュリティ指摘", createdAt: "2026-04-21T11:00:00", body: "音声ファイルの24h自動削除は良いが、要約テキスト側の保持期間とアクセスログの扱いが仕様書に明記されていない。" },
      { id: "c4", author: "u5", type: "活用アイデア", createdAt: "2026-04-20T14:20:00", body: "人事の面談記録要約に転用できそう。ただし個人情報扱いの観点で別レビュー必要。" },
      { id: "c5", author: "u2", type: "技術メモ", createdAt: "2026-04-19T09:45:00", body: "Whisper large-v3 → large-v3-turbo に差し替えると、速度2倍で精度ほぼ同等（社内音声で検証）。ただしGPUメモリ要件に注意。" },
      { id: "c6", author: "u3", type: "不具合報告", createdAt: "2026-04-18T15:00:00", body: "M4A形式の音声で稀に前処理が失敗する。エラーメッセージが英語のまま出るので日本語化してほしい。" },
    ],
    app2: [
      { id: "c7", author: "u2", type: "感想", createdAt: "2026-04-22T13:00:00", body: "出典リンクが必ず表示されるのが安心。規程の条番号まで出るとさらに良い。" },
      { id: "c8", author: "u4", type: "セキュリティ指摘", createdAt: "2026-04-22T09:30:00", body: "個人情報を含む質問のブロック条件が正規表現ベースだと、表記ゆれで抜けるリスクあり。LLMベースの判定に切り替え推奨。" },
      { id: "c9", author: "u3", type: "改善提案", createdAt: "2026-04-21T11:40:00", body: "回答に「関連する規程」セクションを追加できないか。一次回答の周辺情報も示したい。" },
      { id: "c10", author: "u5", type: "活用アイデア", createdAt: "2026-04-20T10:00:00", body: "新入職員向けのオンボーディング資料に組み込みたい。利用ガイドを別途作る予定。" },
      { id: "c11", author: "u1", type: "技術メモ", createdAt: "2026-04-19T14:15:00", body: "text-embedding-3-small → large に変更した場合のコスト試算：月間クエリ1万件で約+¥3,200/月。精度向上と天秤。" },
    ],
    app3: [
      { id: "c12", author: "u2", type: "感想", createdAt: "2026-04-21T10:00:00", body: "信頼度閾値で人手レビューに流すフローが明快。現場オペレーションに馴染む。" },
      { id: "c13", author: "u4", type: "不具合報告", createdAt: "2026-04-20T16:00:00", body: "添付ファイル付きメールでテキスト抽出が失敗するケースあり。添付パーサーの切り替えを検討してほしい。" },
      { id: "c14", author: "u1", type: "改善提案", createdAt: "2026-04-19T13:30:00", body: "分類結果の修正履歴を蓄積して、再学習データにできる仕組みがあると中長期で効く。" },
    ],
    app4: [
      { id: "c15", author: "u3", type: "感想", createdAt: "2026-04-20T11:00:00", body: "表組みが多いマニュアルでもちゃんと引用してくれる。前処理の出来が良い。" },
      { id: "c16", author: "u4", type: "セキュリティ指摘", createdAt: "2026-04-19T14:00:00", body: "マニュアル改訂時、旧版のチャンクが残り続けるリスク。削除フローのドキュメント化を。" },
    ],
    app5: [
      { id: "c17", author: "u2", type: "感想", createdAt: "2026-04-18T16:00:00", body: "3段階の粒度指定が使い分けしやすい。会議前の下読みで便利。" },
      { id: "c18", author: "u3", type: "改善提案", createdAt: "2026-04-17T10:30:00", body: "PDFだけでなくWord・PowerPointにも対応してほしい。" },
    ],
  };

  // Current user
  const currentUser = "u1";

  // Helpers (defined early so later sections can use them)
  const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
  const appsById = byId(apps);

  // Add visibility to existing records (not mutating original too much)
  const visibilityMap = {
    l1: "shared", l2: "shared", l3: "shared", l4: "shared",
    l5: "shared", l6: "private", l7: "shared", l8: "private",
    q1: "shared", q4: "shared",
    n1: "shared", n2: "shared", n3: "shared", n4: "shared", n5: "private",
    app1: "shared", app2: "shared", app5: "shared",
  };
  links.forEach(l => l.visibility = visibilityMap[l.id] || "shared");
  questions.forEach(q => q.visibility = visibilityMap[q.id] || "shared");
  notes.forEach(n => n.visibility = visibilityMap[n.id] || "shared");
  apps.forEach(a => a.visibility = visibilityMap[a.id] || "shared");

  // My private notes (shown only in mypage)
  const privateNotes = [
    {
      id: "mn1", title: "学内認証連携の下書き", purpose: "SAML連携の実装案をまとめる",
      tried: "NextAuth + SAML Provider で PoC。IdP側の属性マッピングを確認。",
      result: "認証は通るが、グループ属性が期待通り取れない。IdPチーム確認要。",
      conclusion: "結論持ち越し。IdPチーム回答待ち。",
      tags: ["t22"], project: "p1", author: "u1",
      createdAt: "2026-04-23T15:00:00", relatedLinks: [], visibility: "private",
    },
    {
      id: "mn2", title: "Gemini 2.0 Flash の長文処理メモ", purpose: "議事録要約で Gemini が使えるか個人検証",
      tried: "同一議事録3件を、Claude / GPT-4o / Gemini で比較。",
      result: "Geminiは高速だが固有名詞の誤りが目立つ。要約の冒頭で事実誤認あり。",
      conclusion: "現時点では要約タスク主力としては採用しない。",
      tags: ["t11", "t18"], project: "p2", author: "u1",
      createdAt: "2026-04-20T22:00:00", relatedLinks: [], visibility: "private",
    },
  ];
  notes.push(...privateNotes);

  // Drafts (下書き中)
  const drafts = [
    { id: "d1", kind: "link", title: "Cursor のエージェント機能のX投稿", updatedAt: "2026-04-23T19:30:00" },
    { id: "d2", kind: "note", title: "FAQ検索アプリのハイブリッド検索検証", updatedAt: "2026-04-22T14:00:00" },
    { id: "d3", kind: "qa", title: "pgvector の HNSW パラメータ再チューニング", updatedAt: "2026-04-21T11:00:00" },
  ];

  // Comment history of current user (u1 comments across apps)
  const myCommentHistory = [];
  Object.entries(commentsByApp).forEach(([appId, cs]) => {
    cs.forEach(c => {
      if (c.author === currentUser) myCommentHistory.push({ ...c, appId, appName: appsById[appId]?.name });
    });
  });

  const favorites = ["l1", "l3", "n2", "app1", "q1"];

  const activity = [
    { id: "act1", type: "link", targetId: "l1", actor: "u1", verb: "共有", at: "2026-04-22T10:15:00" },
    { id: "act2", type: "answer", targetId: "q1", actor: "u2", verb: "回答", at: "2026-04-22T11:15:00" },
    { id: "act3", type: "note", targetId: "n1", actor: "u2", verb: "検証", at: "2026-04-21T16:00:00" },
    { id: "act4", type: "comment", targetId: "app1", actor: "u4", verb: "レビュー", at: "2026-04-21T11:00:00" },
    { id: "act5", type: "app", targetId: "app1", actor: "u2", verb: "更新", at: "2026-04-21T09:00:00" },
    { id: "act6", type: "link", targetId: "l2", actor: "u3", verb: "共有", at: "2026-04-21T18:42:00" },
    { id: "act7", type: "question", targetId: "q3", actor: "u4", verb: "質問", at: "2026-04-21T10:15:00" },
    { id: "act8", type: "link", targetId: "l3", actor: "u2", verb: "共有", at: "2026-04-20T14:05:00" },
  ];

  // Remaining helpers
  const usersById = byId(users);
  const tagsById = byId(tags);
  const projectsById = byId(projects);
  const linksById = byId(links);
  const questionsById = byId(questions);
  const notesById = byId(notes);

  return {
    users, tags, projects, links, questions, answersByQ, notes, apps, commentsByApp, favorites, activity,
    drafts, myCommentHistory, currentUser,
    usersById, tagsById, projectsById, linksById, questionsById, notesById, appsById,
  };
})();
