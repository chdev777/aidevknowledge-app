import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';
import { ComposeModal } from '../compose/ComposeModal.js';
import { TweaksPanel } from '../tweaks/TweaksPanel.js';

export function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <Outlet />
      </main>
      <ComposeModal />
      <TweaksPanel />
    </div>
  );
}
