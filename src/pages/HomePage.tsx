import { HeroActions } from '../components/home/HeroActions.js';
import { Metrics } from '../components/home/Metrics.js';
import { KnowledgeFlow } from '../components/home/KnowledgeFlow.js';
import { RecentLinks } from '../components/home/RecentLinks.js';
import { UnansweredQs } from '../components/home/UnansweredQs.js';
import { RecentApps } from '../components/home/RecentApps.js';
import { RecentNotes } from '../components/home/RecentNotes.js';
import { RecentProjects } from '../components/home/RecentProjects.js';

export function HomePage() {
  return (
    <div className="page">
      <div className="home-hero">
        <div>
          <div className="hero-eyebrow">AI · APP · DEV KNOWLEDGE HUB</div>
          <h1 className="hero-title">
            流さない、<span className="accent">蓄積する</span>。<br />
            AIアプリ開発の実践知を組織に残す。
          </h1>
          <div className="hero-sub">
            DX推進と情報支援グループが、外部情報・質問・検証結果・作成アプリ・レビューを
            一元管理し、後から検索・再利用できるナレッジ基盤。
          </div>
          <HeroActions />
        </div>

        <div>
          <Metrics />
          <div style={{ marginTop: 18 }}>
            <KnowledgeFlow />
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div>
          <RecentLinks />
          <UnansweredQs />
          <RecentApps />
        </div>
        <div>
          <RecentNotes />
          <RecentProjects />
        </div>
      </div>
    </div>
  );
}
