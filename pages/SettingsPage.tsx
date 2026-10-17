import React, { useState } from 'react';
import { useAuth, authRequest, apiRequest, ApiError, AuthUser } from '../lib/auth';
import { navigate } from '../lib/router';
import { validateName, validatePassword, PASSWORD_MIN } from '../lib/validation';
import { DEFAULT_SETTINGS } from '../lib/optimizationSettings';
import { Button, TextField, PasswordField, Alert, SectionCard, PageHeader, Dialog, Badge } from '../components/ui';
import { PasswordStrength } from '../components/PasswordStrength';
import { SettingsPanel, summarizeSettings } from '../components/SettingsPanel';
import { Avatar } from '../components/AccountMenu';
import { OptimizationSettings } from '../types';

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

const ProfileForm: React.FC<{ user: AuthUser }> = ({ user }) => {
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const err = validateName(name);
    setError(err);
    if (err) return;
    setSaving(true);
    try {
      const { user: updated } = await authRequest<{ user: AuthUser }>('/me', { method: 'PATCH', body: { name } });
      setUser(updated);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? (e.fields?.name || e.message) : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 max-w-md">
      <TextField label="Name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} error={error} autoComplete="name" maxLength={80} />
      <TextField label="Email" value={user.email} disabled readOnly hint="Your email address is used to sign in. It can't be changed yet." />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving} disabled={name.trim() === user.name}>Save changes</Button>
        {saved && <span role="status" className="text-sm text-success-700">Saved</span>}
      </div>
    </form>
  );
};

const PreferencesForm: React.FC<{ user: AuthUser }> = ({ user }) => {
  const { setUser } = useAuth();
  const saved = user.preferences?.optimization || null;
  const [draft, setDraft] = useState<OptimizationSettings>(saved || DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved || DEFAULT_SETTINGS);

  const save = async (value: OptimizationSettings | null) => {
    setBusy(true); setMessage(null);
    try {
      const { user: updated } = await authRequest<{ user: AuthUser }>('/preferences', { method: 'PUT', body: { optimization: value } });
      setUser(updated);
      if (value === null) setDraft(DEFAULT_SETTINGS);
      setMessage({ tone: 'success', text: value ? 'Saved. New optimizer sessions start with these settings.' : 'Reset to the built-in defaults.' });
    } catch (e) {
      setMessage({ tone: 'error', text: errorText(e, 'Could not save your preferences.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Currently: <span className="font-medium text-ink">{summarizeSettings(saved || DEFAULT_SETTINGS)}</span>
        {!saved && <Badge className="ml-2">Built-in default</Badge>}
      </p>
      <div className="max-w-md border border-line rounded-xl p-4 sm:p-5 bg-canvas/40">
        <SettingsPanel settings={draft} onChange={(s) => { setDraft(s); setMessage(null); }} />
      </div>
      {message && <Alert tone={message.tone} className="mt-4 max-w-md">{message.text}</Alert>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => save(draft)} loading={busy} disabled={!dirty}>Save as default</Button>
        {saved && <Button variant="secondary" onClick={() => save(null)} disabled={busy}>Reset to built-in defaults</Button>}
      </div>
    </div>
  );
};

const PasswordForm: React.FC<{ email: string }> = ({ email }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);
    setFormError(null);
    const errs: Record<string, string> = {};
    if (!current) errs.currentPassword = 'Enter your current password.';
    const pw = validatePassword(next, email); if (pw) errs.newPassword = pw;
    if (!errs.newPassword && confirm !== next) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await authRequest('/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      setCurrent(''); setNext(''); setConfirm('');
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      else setFormError(errorText(e, 'Could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 max-w-md">
      {formError && <Alert>{formError}</Alert>}
      {done && <Alert tone="success">Password updated. Other devices have been signed out.</Alert>}
      <PasswordField label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} autoComplete="current-password" />
      <PasswordField label="New password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.newPassword} autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters.`} after={<PasswordStrength password={next} />} />
      <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
      <Button type="submit" loading={saving}>Update password</Button>
    </form>
  );
};

const ClearHistory: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const clear = async () => {
    setBusy(true);
    try {
      const r = await apiRequest<{ deleted: number }>('/api/history', { method: 'DELETE' });
      setResult({ tone: 'success', text: r.deleted ? `Deleted ${r.deleted} history ${r.deleted === 1 ? 'record' : 'records'}.` : 'Your history was already empty.' });
      setOpen(false);
    } catch (e) {
      setResult({ tone: 'error', text: errorText(e, 'Could not clear your history.') });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p className="text-sm text-muted max-w-xl">Removes every optimization record (sizes and formats) from your account. Your overview statistics reset to zero.</p>
      {result && <Alert tone={result.tone} className="mt-3 max-w-md">{result.text}</Alert>}
      <Button variant="secondary" className="mt-4" onClick={() => setOpen(true)}>Clear history</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Clear your optimization history?" description="This permanently deletes your history records. It can't be undone.">
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={clear}>Clear history</Button>
        </div>
      </Dialog>
    </div>
  );
};

const DeleteAccount: React.FC = () => {
  const { clearUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authRequest('/me', { method: 'DELETE', body: { password } });
      clearUser();
      navigate('/?account=deleted', { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? (e.fields?.password || e.message) : 'Could not delete your account.');
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted max-w-xl">Permanently deletes your account, your sessions, any pending password-reset links and your optimization history. This can't be undone.</p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>Delete account</Button>
      <Dialog open={open} onClose={() => { setOpen(false); setError(null); }} title="Delete your account?" description="Enter your password and type DELETE to confirm.">
        <form onSubmit={submit} noValidate className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <TextField label="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger" loading={busy} disabled={!password || confirmText !== 'DELETE'}>Delete my account</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState<'one' | 'all' | null>(null);
  if (!user) return null;

  const signOut = async (everywhere: boolean) => {
    setSigningOut(everywhere ? 'all' : 'one');
    try { await logout(everywhere); } finally { navigate('/signin', { replace: true }); }
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <PageHeader title="Settings" description="Manage your profile, optimizer defaults, password and account data." />

      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{user.name}</p>
          <p className="text-sm text-muted truncate">{user.email} · Member since {memberSince}</p>
        </div>
        <Badge tone="brand" className="ml-auto shrink-0">Free plan</Badge>
      </div>

      <div className="space-y-6">
        <SectionCard title="Profile" description="How your name appears in Optimizer.pro.">
          <ProfileForm user={user} />
        </SectionCard>

        <SectionCard title="Default optimization settings" description="The settings the Image Optimizer starts with each time you open it.">
          <PreferencesForm user={user} />
        </SectionCard>

        <SectionCard title="Password" description="Changing your password signs you out on other devices.">
          <PasswordForm email={user.email} />
        </SectionCard>

        <SectionCard title="Sessions" description="Sign out of this browser, or of every device where you're signed in.">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => signOut(false)} loading={signingOut === 'one'} disabled={!!signingOut}>Sign out</Button>
            <Button variant="secondary" onClick={() => signOut(true)} loading={signingOut === 'all'} disabled={!!signingOut}>Sign out on all devices</Button>
          </div>
        </SectionCard>

        <SectionCard title="Optimization history">
          <ClearHistory />
        </SectionCard>

        <section className="bg-white border border-danger-500/30 rounded-xl shadow-card">
          <div className="px-5 md:px-6 py-4 border-b border-danger-500/20">
            <h2 className="text-base font-semibold text-danger-700">Delete account</h2>
          </div>
          <div className="px-5 md:px-6 py-5"><DeleteAccount /></div>
        </section>
      </div>
    </div>
  );
};
