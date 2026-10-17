import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthStatus } from './routes';
import type { OptimizationSettings } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: 'free';
  createdAt: string;
  preferences: { optimization: OptimizationSettings | null };
}

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  code?: string;
  constructor(message: string, status: number, fields?: Record<string, string>, code?: string) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

// Fired when a private API answers 401 (session expired or revoked elsewhere).
const unauthorizedListeners = new Set<() => void>();

/** JSON request helper for the API. The session lives in an httpOnly cookie — nothing is stored client-side. */
export const apiRequest = async <T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method || 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0, undefined, 'network');
  }
  if (res.status === 204) return undefined as T;
  let data: any = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    if (res.status === 401 && data?.code === 'unauthenticated') unauthorizedListeners.forEach(l => l());
    const fallback = res.status === 404 ? 'This service is not available on this deployment.' : `Request failed (${res.status}).`;
    throw new ApiError(data?.error || fallback, res.status, data?.fields, data?.code);
  }
  return data as T;
};

export const authRequest = <T = any>(path: string, init: { method?: string; body?: unknown } = {}) => apiRequest<T>('/api/auth' + path, init);

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Set when the account service could not be reached while loading the session. */
  serviceError: string | null;
  /** True after a private request found the session had ended. */
  sessionExpired: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  signup: (input: { name: string; email: string; password: string; acceptTerms: boolean }) => Promise<AuthUser>;
  logout: (everywhere?: boolean) => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authRequest<{ user: AuthUser | null }>('/me')
      .then(({ user }) => { if (!cancelled) { setUserState(user); setStatus(user ? 'authenticated' : 'anonymous'); } })
      .catch((e) => { if (!cancelled) { setUserState(null); setStatus('anonymous'); setServiceError(e instanceof Error ? e.message : 'Unavailable'); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Keep the signed-in UI (and any images in the workspace) mounted; the app shell
    // shows a sign-in dialog instead of redirecting and losing work.
    const onUnauthorized = () => setSessionExpired(true);
    unauthorizedListeners.add(onUnauthorized);
    return () => { unauthorizedListeners.delete(onUnauthorized); };
  }, []);

  const setUser = useCallback((u: AuthUser) => { setUserState(u); setStatus('authenticated'); setSessionExpired(false); setServiceError(null); }, []);
  const clearUser = useCallback(() => { setUserState(null); setStatus('anonymous'); }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const { user } = await authRequest<{ user: AuthUser }>('/login', { method: 'POST', body: { email, password, remember } });
    setUser(user);
    return user;
  }, [setUser]);

  const signup = useCallback(async (input: { name: string; email: string; password: string; acceptTerms: boolean }) => {
    const { user } = await authRequest<{ user: AuthUser }>('/signup', { method: 'POST', body: input });
    setUser(user);
    return user;
  }, [setUser]);

  const logout = useCallback(async (everywhere = false) => {
    try {
      await authRequest('/logout', { method: 'POST', body: { everywhere } });
    } finally {
      setUserState(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, serviceError, sessionExpired, login, signup, logout, setUser, clearUser }),
    [status, user, serviceError, sessionExpired, login, signup, logout, setUser, clearUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?';

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
