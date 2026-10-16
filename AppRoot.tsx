
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { navigate, useLocation, Link } from './lib/router';
import { resolveRoute, AppTab } from './lib/routes';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import { AppWorkspace } from './pages/AppWorkspace';
import { FullPageSpinner, Logo, buttonClass } from './components/ui';

const TAB_TITLES: Record<AppTab, string> = {
  workspace: 'Workspace',
  statistics: 'Statistics',
  guide: 'Guide',
  updates: "What's new",
  account: 'Account',
};

const ROUTE_TITLES: Record<string, string> = {
  login: 'Log in',
  signup: 'Sign up',
  'forgot-password': 'Reset password',
  'reset-password': 'Choose a new password',
  'not-found': 'Page not found',
};

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-canvas flex flex-col">
    <header className="h-16 px-4 sm:px-6 flex items-center"><Logo /></header>
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-16">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Page not found</h1>
      <p className="mt-3 text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className={buttonClass('primary', 'lg', 'mt-8')}>Go to home</Link>
    </main>
  </div>
);

const Routes: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const { status } = useAuth();
  const resolution = resolveRoute(pathname, search, status);

  useEffect(() => {
    if (resolution.kind === 'redirect') navigate(resolution.to, { replace: true });
  }, [resolution.kind, resolution.kind === 'redirect' ? resolution.to : '']);

  // Page title
  useEffect(() => {
    if (resolution.kind !== 'render') return;
    const label = resolution.route === 'app' && resolution.tab ? TAB_TITLES[resolution.tab] : ROUTE_TITLES[resolution.route];
    document.title = label ? `${label} · Optimizer.pro` : 'Optimizer.pro — Image optimization workspace';
  }, [resolution.kind, resolution.kind === 'render' ? resolution.route : '', resolution.kind === 'render' ? resolution.tab : '']);

  // Scroll to top on page change (or to the hash target on the landing page)
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  if (resolution.kind !== 'render') return <FullPageSpinner />;

  switch (resolution.route) {
    case 'landing': return <LandingPage />;
    case 'login': return <LoginPage />;
    case 'signup': return <SignupPage />;
    case 'forgot-password': return <ForgotPasswordPage />;
    case 'reset-password': return <ResetPasswordPage />;
    case 'app': return <AppWorkspace activeTab={resolution.tab || 'workspace'} />;
    default: return <NotFound />;
  }
};

const App: React.FC = () => (
  <AuthProvider>
    <Routes />
  </AuthProvider>
);

export default App;
