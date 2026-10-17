import React, { Suspense, lazy, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { navigate, useLocation } from './lib/router';
import { resolveRoute, AppTab, NOINDEX_ROUTES, RouteId } from './lib/routes';
import { LandingPage } from './pages/LandingPage';
import { SignInPage, SignupPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import { FullPageSpinner, Logo, LinkButton } from './components/ui';

// The dashboard (optimizer engine, JSZip, history) loads only after sign-in, keeping the landing page light.
const AppWorkspace = lazy(() => import('./pages/AppWorkspace').then(m => ({ default: m.AppWorkspace })));

const TAB_TITLES: Record<AppTab, string> = {
  overview: 'Overview',
  optimizer: 'Image Optimizer',
  history: 'Optimization History',
  settings: 'Settings',
  help: 'Help & Support',
};

const ROUTE_TITLES: Partial<Record<RouteId, string>> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  signin: 'Sign in',
  signup: 'Create your free account',
  'forgot-password': 'Reset password',
  'reset-password': 'Choose a new password',
  'not-found': 'Page not found',
};

const DEFAULT_TITLE = 'Optimizer.pro — Make your images smaller, keep your quality';

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-canvas flex flex-col">
    <header className="h-16 px-4 sm:px-6 flex items-center"><Logo /></header>
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-16">
      <p className="text-sm font-semibold text-brand-800">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Page not found</h1>
      <p className="mt-3 text-muted">The page you're looking for doesn't exist or has moved.</p>
      <LinkButton to="/" size="lg" className="mt-8">Go to home</LinkButton>
    </main>
  </div>
);

/** Keeps <meta name="robots"> in sync so private and auth pages are never indexed. */
const setRobots = (noindex: boolean) => {
  let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'robots';
    document.head.appendChild(tag);
  }
  tag.content = noindex ? 'noindex, nofollow' : 'index, follow';
};

const Routes: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const { status } = useAuth();
  const resolution = resolveRoute(pathname, search, status);

  useEffect(() => {
    if (resolution.kind === 'redirect') navigate(resolution.to, { replace: true });
  }, [resolution.kind, resolution.kind === 'redirect' ? resolution.to : '']);

  // Page title + robots
  useEffect(() => {
    if (resolution.kind !== 'render') return;
    const label = resolution.route === 'app' && resolution.tab ? TAB_TITLES[resolution.tab] : ROUTE_TITLES[resolution.route];
    document.title = label ? `${label} · Optimizer.pro` : DEFAULT_TITLE;
    setRobots(NOINDEX_ROUTES.includes(resolution.route));
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
    case 'privacy': return <PrivacyPage />;
    case 'terms': return <TermsPage />;
    case 'signin': return <SignInPage />;
    case 'signup': return <SignupPage />;
    case 'forgot-password': return <ForgotPasswordPage />;
    case 'reset-password': return <ResetPasswordPage />;
    case 'app': return <Suspense fallback={<FullPageSpinner />}><AppWorkspace activeTab={resolution.tab || 'overview'} /></Suspense>;
    default: return <NotFound />;
  }
};

const App: React.FC = () => (
  <AuthProvider>
    <Routes />
  </AuthProvider>
);

export default App;
