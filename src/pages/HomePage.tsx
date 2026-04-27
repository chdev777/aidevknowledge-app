import { useAuth } from '../lib/firebase/auth-context.js';
import { QuickActions } from '../components/home/QuickActions.js';
import { KnowledgeFlow } from '../components/home/KnowledgeFlow.js';
import { RecentLinks } from '../components/home/RecentLinks.js';
import { UnansweredQs } from '../components/home/UnansweredQs.js';
import { RecentNotes } from '../components/home/RecentNotes.js';
import { RecentApps } from '../components/home/RecentApps.js';
import { Metrics } from '../components/home/Metrics.js';

export function HomePage() {
  const { profile } = useAuth();
  return (
    <div className="page page-home">
      <header className="page-head">
        <h1 className="page-title">AIアプリ開発ナレッジ共有ハブ</h1>
        <p className="page-subtitle">
          {profile?.name ? `${profile.name} さん` : ''} ─
          流れない、蓄積されるナレッジ基盤
        </p>
      </header>

      <QuickActions />
      <KnowledgeFlow />
      <Metrics />

      <div className="home-columns">
        <RecentLinks />
        <UnansweredQs />
      </div>
      <div className="home-columns">
        <RecentNotes />
        <RecentApps />
      </div>
    </div>
  );
}
