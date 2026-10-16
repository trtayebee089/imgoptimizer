import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthStatus } from './routes';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: 'free';
  createdAt: string;
}

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** JSON request helper for the auth API. Session lives in an httpOnly cookie — nothing is stored client-side. */
export const authRequest = async <T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch('/api/auth' + path, {
      method: init.method || 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  if (res.status === 204) return undefined as T;
  let data: any = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.fields);
  return data as T;
};

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: (everywhere?: boolean) => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    authRequest<{ user: AuthUser | null }>('/me')
      .then(({ user }) => { if (!cancelled) { setUserState(user); setStatus(user ? 'authenticated' : 'anonymous'); } })
      .catch(() => { if (!cancelled) { setUserState(null); setStatus('anonymous'); } });
    return () => { cancelled = true; };
  }, []);

  const setUser = useCallback((u: AuthUser) => { setUserState(u); setStatus('authenticated'); }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const { user } = await authRequest<{ user: AuthUser }>('/login', { method: 'POST', body: { email, password, remember } });
    setUser(user);
    return user;
  }, [setUser]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const { user } = await authRequest<{ user: AuthUser }>('/signup', { method: 'POST', body: { name, email, password } });
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

  const value = useMemo(() => ({ status, user, login, signup, logout, setUser }), [status, user, login, signup, logout, setUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?';
