// Pure route table + guard logic (kept framework-free so it can be unit tested).

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type RouteId =
  | 'landing' | 'privacy' | 'terms'
  | 'signin' | 'signup' | 'forgot-password' | 'reset-password'
  | 'app' | 'not-found';

export type AppTab = 'overview' | 'optimizer' | 'history' | 'settings' | 'help';

export const TAB_PATHS: Record<AppTab, string> = {
  overview: '/app',
  optimizer: '/app/optimize',
  history: '/app/history',
  settings: '/app/settings',
  help: '/app/help',
};

export const APP_TABS: Record<string, AppTab> = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as AppTab]),
);

/** Old paths kept working after the redesign. */
const LEGACY_REDIRECTS: Record<string, string> = {
  '/login': '/signin',
  '/app/statistics': '/app/history',
  '/app/guide': '/app/help',
  '/app/account': '/app/settings',
  '/app/updates': '/app',
};

const PUBLIC_ROUTES: Record<string, RouteId> = {
  '/': 'landing',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/signin': 'signin',
  '/signup': 'signup',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
};

/** Routes that a signed-in user is sent away from. */
const GUEST_ONLY: RouteId[] = ['signin', 'signup'];

/** Routes that should never be indexed by search engines. */
export const NOINDEX_ROUTES: RouteId[] = ['signin', 'signup', 'forgot-password', 'reset-password', 'app', 'not-found'];

export const normalizePath = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path) || '/';

export type Resolution =
  | { kind: 'render'; route: RouteId; tab?: AppTab }
  | { kind: 'redirect'; to: string }
  | { kind: 'wait' };

/** Only allow same-site relative redirect targets (prevents open redirects via ?next=). */
export const safeNext = (next: string | null | undefined, fallback = '/app') =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;

export const resolveRoute = (rawPath: string, search: string, status: AuthStatus): Resolution => {
  const path = normalizePath(rawPath);

  const legacy = LEGACY_REDIRECTS[path];
  if (legacy) return { kind: 'redirect', to: legacy + search };

  const tab = APP_TABS[path];
  if (tab) {
    if (status === 'loading') return { kind: 'wait' };
    if (status === 'anonymous') return { kind: 'redirect', to: `/signin?next=${encodeURIComponent(path)}` };
    return { kind: 'render', route: 'app', tab };
  }

  const route = PUBLIC_ROUTES[path];
  if (!route) return { kind: 'render', route: 'not-found' };

  if (GUEST_ONLY.includes(route)) {
    if (status === 'loading') return { kind: 'wait' };
    if (status === 'authenticated') {
      return { kind: 'redirect', to: safeNext(new URLSearchParams(search).get('next')) };
    }
  }
  return { kind: 'render', route };
};
