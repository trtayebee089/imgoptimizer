// Pure route table + guard logic (kept framework-free so it can be unit tested).

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type RouteId =
  | 'landing' | 'login' | 'signup' | 'forgot-password' | 'reset-password'
  | 'app' | 'not-found';

export type AppTab = 'workspace' | 'statistics' | 'guide' | 'updates' | 'account';

export const APP_TABS: Record<string, AppTab> = {
  '/app': 'workspace',
  '/app/statistics': 'statistics',
  '/app/guide': 'guide',
  '/app/updates': 'updates',
  '/app/account': 'account',
};

export const TAB_PATHS: Record<AppTab, string> = {
  workspace: '/app',
  statistics: '/app/statistics',
  guide: '/app/guide',
  updates: '/app/updates',
  account: '/app/account',
};

const PUBLIC_ROUTES: Record<string, RouteId> = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
  '/forgot-password': 'forgot-password',
  '/reset-password': 'reset-password',
};

/** Routes that a signed-in user is sent away from. */
const GUEST_ONLY: RouteId[] = ['login', 'signup'];

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
  const tab = APP_TABS[path];

  if (tab) {
    if (status === 'loading') return { kind: 'wait' };
    if (status === 'anonymous') return { kind: 'redirect', to: `/login?next=${encodeURIComponent(path)}` };
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
