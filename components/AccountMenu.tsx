import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, UserRound, History, BookOpen } from 'lucide-react';
import { useAuth, initialsOf } from '../lib/auth';
import { Link, navigate } from '../lib/router';

export const Avatar: React.FC<{ name: string; size?: 'sm' | 'lg' }> = ({ name, size = 'sm' }) => (
  <span
    className={`${size === 'lg' ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs'} rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center shrink-0`}
    aria-hidden="true"
  >
    {initialsOf(name)}
  </span>
);

export const AccountMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items: HTMLElement[] = menuRef.current ? Array.from(menuRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')) : [];
        if (!items.length) return;
        e.preventDefault();
        const idx = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  const itemCls = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-ink hover:bg-canvas focus:bg-canvas focus:outline-none';

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-full hover:bg-canvas"
      >
        <Avatar name={user.name} />
        <ChevronDown size={15} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div ref={menuRef} role="menu" aria-label="Account" className="absolute right-0 top-12 w-64 bg-white border border-line rounded-xl shadow-overlay p-1.5 z-[120]">
          <div className="px-3 py-2.5 border-b border-line mb-1">
            <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
            <p className="text-[13px] text-muted truncate">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-success-50 text-success-700 text-xs font-semibold">Free plan</span>
          </div>
          <Link to="/app/account" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
            <UserRound size={16} className="text-muted" aria-hidden="true" /> Account settings
          </Link>
          <Link to="/app/guide" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
            <BookOpen size={16} className="text-muted" aria-hidden="true" /> Help & guide
          </Link>
          <Link to="/app/updates" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
            <History size={16} className="text-muted" aria-hidden="true" /> What's new
          </Link>
          <div className="border-t border-line my-1" role="separator" />
          <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut} className={itemCls}>
            <LogOut size={16} className="text-muted" aria-hidden="true" /> {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};
