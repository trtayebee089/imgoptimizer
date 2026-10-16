import React, { useSyncExternalStore } from 'react';

// Minimal History API router — avoids adding a routing dependency.

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
  };
};

const getSnapshot = () => window.location.pathname + window.location.search + window.location.hash;

export const navigate = (to: string, opts: { replace?: boolean } = {}) => {
  if (to === getSnapshot()) return;
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  notify();
};

export const useLocation = () => {
  useSyncExternalStore(subscribe, getSnapshot);
  return { pathname: window.location.pathname, search: window.location.search, hash: window.location.hash };
};

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; replace?: boolean };

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ to, replace, onClick, ...rest }, ref) => (
  <a
    ref={ref}
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target) return;
      e.preventDefault();
      navigate(to, { replace });
    }}
    {...rest}
  />
));
Link.displayName = 'Link';
