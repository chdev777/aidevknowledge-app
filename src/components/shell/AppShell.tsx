import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';
import { AnnouncementsBanner } from './AnnouncementsBanner.js';
import { ComposeModal } from '../compose/ComposeModal.js';
import { TweaksPanel } from '../tweaks/TweaksPanel.js';
import { FeedbackFab } from '../feedback/FeedbackFab.js';

export function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <AnnouncementsBanner />
        <Outlet />
      </main>
      <ComposeModal />
      <TweaksPanel />
      <FeedbackFab />
    </div>
  );
}
