import React, { useState } from 'react';
import { useAuth, authRequest, ApiError, AuthUser } from '../lib/auth';
import { navigate } from '../lib/router';
import { validateName, validatePassword } from '../lib/validation';
import { Button, TextField, PasswordField, Alert } from '../components/ui';
import { Avatar } from '../components/AccountMenu';

const Card: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="bg-white border border-line rounded-xl shadow-card">
    <div className="px-5 md:px-6 py-4 border-b border-line">
      <h2 className="text-base font-semibold text-ink font-sans">{title}</h2>
      {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
    </div>
    <div className="px-5 md:px-6 py-5">{children}</div>
  </section>
);

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
      <TextField label="Email" value={user.email} disabled readOnly hint="Your email address is used to sign in." />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving} disabled={name.trim() === user.name}>Save changes</Button>
        {saved && <span role="status" className="text-sm text-success-700">Saved</span>}
      </div>
    </form>
  );
};

const PasswordForm: React.FC = () => {
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
    const pw = validatePassword(next); if (pw) errs.newPassword = pw;
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
      else setFormError(e instanceof Error ? e.message : 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 max-w-md">
      {formError && <Alert>{formError}</Alert>}
      {done && <Alert tone="success">Password updated. Other devices have been signed out.</Alert>}
      <PasswordField label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} autoComplete="current-password" />
      <PasswordField label="New password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.newPassword} autoComplete="new-password" hint="At least 8 characters." />
      <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
      <Button type="submit" loading={saving}>Update password</Button>
    </form>
  );
};

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState<'one' | 'all' | null>(null);
  if (!user) return null;

  const signOut = async (everywhere: boolean) => {
    setSigningOut(everywhere ? 'all' : 'one');
    try { await logout(everywhere); } finally { navigate('/login', { replace: true }); }
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <header className="flex items-center gap-4 mb-6 md:mb-8">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-ink truncate">Account</h1>
          <p className="text-sm text-muted truncate">{user.email} · Member since {memberSince}</p>
        </div>
      </header>

      <div className="space-y-5">
        <Card title="Plan">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink flex items-center gap-2">
                Free <span className="px-2 py-0.5 rounded-md bg-success-50 text-success-700 text-xs font-semibold">Current plan</span>
              </p>
              <p className="text-sm text-muted mt-1">Every optimizer feature is included. No payment details required.</p>
            </div>
          </div>
        </Card>

        <Card title="Profile" description="How your name appears in Optimizer.pro.">
          <ProfileForm user={user} />
        </Card>

        <Card title="Password" description="Changing your password signs you out on other devices.">
          <PasswordForm />
        </Card>

        <Card title="Sessions">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => signOut(false)} loading={signingOut === 'one'} disabled={!!signingOut}>Sign out</Button>
            <Button variant="danger" onClick={() => signOut(true)} loading={signingOut === 'all'} disabled={!!signingOut}>Sign out on all devices</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
