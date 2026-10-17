import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Wand2, History, Settings, LifeBuoy, LogOut, Menu, X, Loader2, UploadCloud, Plus, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Logo, Button, Dialog, TextField, PasswordField, Alert, buttonClass } from '../components/ui';
import { Avatar } from '../components/AccountMenu';
import { useAuth, ApiError } from '../lib/auth';
import { Link, navigate } from '../lib/router';
import { AppTab, TAB_PATHS } from '../lib/routes';
import { DEFAULT_SETTINGS } from '../lib/optimizationSettings';
import { useOptimizerQueue } from '../hooks/useOptimizerQueue';
import { OverviewPage } from './OverviewPage';
import { OptimizerPage } from './OptimizerPage';
import { HistoryPage } from './HistoryPage';
import { SettingsPage } from './SettingsPage';
import { HelpPage } from './HelpPage';

const NAV: { id: AppTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'optimizer', label: 'Image Optimizer', icon: Wand2 },
  { id: 'history', label: 'Optimization History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: LifeBuoy },
];

const TITLES: Record<AppTab, string> = {
  overview: 'Overview', optimizer: 'Image Optimizer', history: 'Optimization History', settings: 'Settings', help: 'Help & Support',
};

/** Lets the user sign in again without leaving the page, so queued images and results are kept. */
const ReauthDialog: React.FC = () => {
  const { sessionExpired, user, login, clearUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await login(email, password, true); setPassword(''); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  };
  return (
    <Dialog
      open={sessionExpired}
      onClose={() => { /* must sign in or leave */ }}
      title="Your session has ended"
      description="Sign in again to keep saving your history. Images in your workspace are kept while this dialog is open."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => { clearUser(); navigate('/signin', { replace: true }); }}>Go to sign in page</Button>
          <Button type="submit" loading={busy}>Sign in</Button>
        </div>
      </form>
    </Dialog>
  );
};

const SidebarContent: React.FC<{ activeTab: AppTab; queueCount: number; processing: boolean; onNavigate?: () => void }> = ({ activeTab, queueCount, processing, onNavigate }) => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { navigate('/signin', { replace: true }); }
  };
  return (
    <div className="h-full flex flex-col">
      <div className="h-16 px-5 flex items-center shrink-0"><Logo to="/app" /></div>
      <nav aria-label="Workspace" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {NAV.map(n => {
            const active = activeTab === n.id;
            return (
              <li key={n.id}>
                <Link
                  to={TAB_PATHS[n.id]}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`h-10 px-3 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-800' : 'text-muted hover:text-ink hover:bg-ink/[0.04]'}`}
                >
                  <n.icon size={18} className={active ? 'text-brand-700' : ''} aria-hidden="true" />
                  <span className="flex-1 truncate">{n.label}</span>
                  {n.id === 'optimizer' && processing && <Loader2 size={14} className="animate-spin text-brand-700" aria-label="Optimizing" />}
                  {n.id === 'optimizer' && queueCount > 0 && (
                    <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-brand-500 text-on-brand text-[11px] font-semibold flex items-center justify-center tabular-nums" aria-label={`${queueCount} in queue`}>{queueCount}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {user && (
        <div className="border-t border-line p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-1 w-full h-9 px-3 flex items-center gap-2.5 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-ink/[0.04] disabled:opacity-60"
          >
            {loggingOut ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};

export const AppWorkspace: React.FC<{ activeTab: AppTab }> = ({ activeTab }) => {
  const { user } = useAuth();
  const optimizer = useOptimizerQueue(user?.preferences?.optimization || DEFAULT_SETTINGS);
  const { addFiles, queue, isProcessingQueue, toast, showToast } = optimizer;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  const addAndOpen = (files: File[]) => {
    if (activeTab !== 'optimizer') navigate(TAB_PATHS.optimizer);
    addFiles(files);
  };
  const addRef = useRef(addAndOpen);
  addRef.current = addAndOpen;

  // Drop or paste images anywhere in the app.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
    const onEnter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); dragCounter.current += 1; setIsDragging(true); };
    const onLeave = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); dragCounter.current = Math.max(0, dragCounter.current - 1); if (dragCounter.current === 0) setIsDragging(false); };
    const onOver = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;
      const files = Array.from(e.dataTransfer?.files || []);
      const images = files.filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp|svg|heic|tiff?)$/i.test(f.name));
      if (images.length) addRef.current(images);
      const rejected = files.length - images.length;
      if (rejected > 0) showToast(`Skipped ${rejected} non-image ${rejected === 1 ? 'file' : 'files'}`, 'info');
    };
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const files: File[] = [];
      for (const item of Array.from(e.clipboardData?.items || [])) {
        if (item.type.startsWith('image/')) { const f = item.getAsFile(); if (f) files.push(f); }
      }
      if (files.length) addRef.current(files);
    };
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', onPaste);
    };
  }, [showToast]);

  // Warn before leaving while images are still being processed or results haven't been downloaded.
  useEffect(() => {
    if (!queue.length) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [queue.length]);

  useEffect(() => { mainRef.current?.scrollTo(0, 0); setDrawerOpen(false); }, [activeTab]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const renderContent = () => {
    switch (activeTab) {
      case 'optimizer': return <OptimizerPage optimizer={optimizer} isDragging={isDragging} />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      case 'help': return <HelpPage />;
      case 'overview':
      default: return <OverviewPage queueCount={queue.length} />;
    }
  };

  const ToastIcon = toast?.tone === 'error' ? AlertCircle : toast?.tone === 'info' ? Info : CheckCircle2;

  return (
    <div className="h-[100dvh] w-full flex bg-canvas text-ink overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-raised">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-line">
        <SidebarContent activeTab={activeTab} queueCount={queue.length} processing={isProcessingQueue} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-white shadow-overlay animate-op-fade-up">
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3.5 w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:bg-canvas z-10">
              <X size={20} aria-hidden="true" />
            </button>
            <SidebarContent activeTab={activeTab} queueCount={queue.length} processing={isProcessingQueue} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur border-b border-line flex items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation" aria-expanded={drawerOpen} className="lg:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-ink hover:bg-canvas">
            <Menu size={22} aria-hidden="true" />
          </button>
          <p className="text-[15px] font-semibold text-ink truncate">{TITLES[activeTab]}</p>
          <div className="ml-auto flex items-center gap-2">
            {isProcessingQueue && activeTab !== 'optimizer' && (
              <Link to={TAB_PATHS.optimizer} className="hidden sm:inline-flex items-center gap-2 h-8 px-3 text-[13px] font-medium text-brand-800 bg-brand-50 border border-brand-200 rounded-lg">
                <Loader2 size={13} className="animate-spin" aria-hidden="true" /> Optimizing…
              </Link>
            )}
            {activeTab !== 'optimizer' && (
              <Link to={TAB_PATHS.optimizer} className={buttonClass('primary', 'sm')}>
                <Plus size={15} aria-hidden="true" /><span className="hidden sm:inline">Optimize New Images</span><span className="sm:hidden">Optimize</span>
              </Link>
            )}
          </div>
        </header>

        <main id="main" ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Drag overlay */}
      <div className="fixed inset-0 z-[100] bg-brand-500/10 backdrop-blur-[2px] flex items-center justify-center p-6 transition-opacity duration-200 pointer-events-none" style={{ opacity: isDragging ? 1 : 0 }} aria-hidden="true">
        <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-brand-600" />
        <div className="relative bg-white rounded-2xl shadow-overlay px-8 py-7 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-on-brand flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} /></div>
          <p className="text-lg font-semibold text-ink">Drop images to add them</p>
          <p className="text-sm text-muted mt-1">They stay on your device and are optimized with your current settings.</p>
        </div>
      </div>

      {/* Toast */}
      <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] w-max max-w-[calc(100vw-2rem)]">
        {toast && (
          <div key={toast.id} className="flex items-center gap-2.5 bg-ink text-white pl-3 pr-4 py-2.5 rounded-xl shadow-overlay text-sm font-medium animate-op-fade-up">
            <ToastIcon size={17} className={toast.tone === 'error' ? 'text-danger-500 shrink-0' : 'text-brand-400 shrink-0'} aria-hidden="true" />
            <span>{toast.message}</span>
          </div>
        )}
      </div>

      <ReauthDialog />
    </div>
  );
};
