import React, { useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth, authRequest, ApiError } from '../lib/auth';
import { Link, navigate, useLocation } from '../lib/router';
import { safeNext } from '../lib/routes';
import { normalizeEmail, validateEmail, validateName, validatePassword, PASSWORD_MIN } from '../lib/validation';
import { Logo, Button, TextField, PasswordField, Checkbox, Alert } from '../components/ui';

const AuthLayout: React.FC<{ title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-canvas flex flex-col">
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-page w-full mx-auto">
      <Logo />
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink rounded-md px-2 py-1">
        <ArrowLeft size={15} aria-hidden="true" /> Back to home
      </Link>
    </header>
    <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[420px]">
        <div className="bg-white border border-line rounded-2xl shadow-raised p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  </div>
);

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

// --- Login ---

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const query = useQuery();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const resetDone = query.get('reset') === '1';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(normalizeEmail(email)); if (emailErr) errs.email = emailErr;
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await login(normalizeEmail(email), password, remember);
      navigate(safeNext(query.get('next')), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Log in to open your workspace."
      footer={<>Don't have an account? <Link to={`/signup${query.get('next') ? `?next=${encodeURIComponent(query.get('next')!)}` : ''}`} className="font-semibold text-brand-600 hover:text-brand-700">Sign up free</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {resetDone && <Alert tone="success">Your password was reset. Log in with your new password.</Alert>}
        {formError && <Alert>{formError}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" autoFocus inputMode="email" />
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          labelAction={<Link to="/forgot-password" className="text-[13px] font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>}
        />
        <Checkbox label="Keep me signed in for 30 days" checked={remember} onChange={setRemember} />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>{submitting ? 'Logging in…' : 'Log in'}</Button>
      </form>
    </AuthLayout>
  );
};

// --- Signup ---

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const query = useQuery();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    const n = validateName(name); if (n) errs.name = n;
    const em = validateEmail(normalizeEmail(email)); if (em) errs.email = em;
    const pw = validatePassword(password); if (pw) errs.password = pw;
    if (!errs.password && confirm !== password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await signup(name.trim(), normalizeEmail(email), password);
      navigate(safeNext(query.get('next')), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Free to use. No credit card required."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" autoFocus maxLength={80} />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" inputMode="email" />
        <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters.`} />
        <PasswordField label="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>{submitting ? 'Creating account…' : 'Create free account'}</Button>
        <p className="flex items-start gap-2 text-[13px] text-muted">
          <ShieldCheck size={16} className="text-brand-500 shrink-0 mt-px" aria-hidden="true" />
          Your images stay in your browser. Your account only stores your name, email and a hashed password.
        </p>
      </form>
    </AuthLayout>
  );
};

// --- Forgot password ---

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ delivery: 'server-log' | 'unavailable' } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const em = validateEmail(normalizeEmail(email));
    setError(em);
    if (em) return;
    setSubmitting(true);
    try {
      const res = await authRequest<{ ok: true; delivery: 'server-log' | 'unavailable' }>('/forgot-password', { method: 'POST', body: { email: normalizeEmail(email) } });
      setResult({ delivery: res.delivery });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <AuthLayout title="Check the next step" footer={<Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Back to log in</Link>}>
        {result.delivery === 'server-log' ? (
          <Alert tone="info">
            If an account exists for <strong>{normalizeEmail(email)}</strong>, a reset link has been created. This deployment does not send email yet — in development mode the link is written to the server log. It expires in one hour.
          </Alert>
        ) : (
          <Alert tone="warning">
            Password reset by email is not available on this deployment yet. Please contact the site administrator to regain access to your account.
          </Alert>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email address you signed up with."
      footer={<>Remembered it? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" autoFocus inputMode="email" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>Request reset link</Button>
      </form>
    </AuthLayout>
  );
};

// --- Reset password ---

export const ResetPasswordPage: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    const pw = validatePassword(password); if (pw) errs.password = pw;
    if (!errs.password && confirm !== password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await authRequest('/reset-password', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" footer={<Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">Request a new link</Link>}>
        <Alert>This password reset link is missing its token. Request a new link and try again.</Alert>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center text-center gap-3">
          <CheckCircle2 size={40} className="text-success-500" aria-hidden="true" />
          <p className="text-sm text-muted">Your password has been changed and all existing sessions were signed out.</p>
          <Button size="lg" className="w-full mt-2" onClick={() => navigate('/login?reset=1', { replace: true })}>Continue to log in</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" footer={<Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Back to log in</Link>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}{' '}<Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>.</Alert>}
        <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" autoFocus hint={`At least ${PASSWORD_MIN} characters.`} />
        <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>Update password</Button>
      </form>
    </AuthLayout>
  );
};
