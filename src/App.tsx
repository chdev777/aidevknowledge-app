import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/firebase/auth-context.js';
import { ErrorBoundary } from './components/shared/ErrorBoundary.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { RequireAuth } from './components/shell/RequireAuth.js';
import { AppShell } from './components/shell/AppShell.js';
import { HomePage } from './pages/HomePage.js';
import { LinksPage } from './pages/links/LinksPage.js';
import { LinkDetailPage } from './pages/links/LinkDetailPage.js';
import { QAPage } from './pages/qa/QAPage.js';
import { QADetailPage } from './pages/qa/QADetailPage.js';
import { NotesPage } from './pages/notes/NotesPage.js';
import { NoteDetailPage } from './pages/notes/NoteDetailPage.js';
import { AppsPage } from './pages/apps/AppsPage.js';
import { AppDetailPage } from './pages/apps/AppDetailPage.js';
import { MyPage } from './pages/MyPage.js';
import { ProjectsPage } from './pages/projects/ProjectsPage.js';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage.js';
import { TagsPage } from './pages/tags/TagsPage.js';
import { FavoritesPage } from './pages/favorites/FavoritesPage.js';
import { AdminPage } from './pages/admin/AdminPage.js';
import { ForbiddenPage } from './pages/ForbiddenPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="links" element={<LinksPage />} />
                <Route path="links/:id" element={<LinkDetailPage />} />
                <Route path="qa" element={<QAPage />} />
                <Route path="qa/:id" element={<QADetailPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="notes/:id" element={<NoteDetailPage />} />
                <Route path="apps" element={<AppsPage />} />
                <Route path="apps/:id" element={<AppDetailPage />} />
                <Route path="me" element={<MyPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="tags" element={<TagsPage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
