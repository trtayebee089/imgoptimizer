import React, { useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, ArrowLeft, MailCheck, Wand2, FileImage, TrendingDown } from 'lucide-react';
import { useAuth, authRequest, ApiError } from '../lib/auth';
import { Link, navigate, useLocation } from '../lib/router';
import { safeNext } from '../lib/routes';
import { normalizeEmail, validateEmail, validateName, validatePassword, PASSWORD_MIN } from '../lib/validation';
import { Logo, LogoMark, Button, TextField, PasswordField, Checkbox, Alert, TextLink } from '../components/ui';
import { PasswordStrength } from '../components/PasswordStrength';

const POINTS = [
  { icon: Wand2, text: 'Smart mode works toward the file size you choose' },
  { icon: FileImage, text: 'Convert to WebP, JPEG or PNG' },
  { icon: TrendingDown, text: 'See real before-and-after sizes for every image' },
  { icon: ShieldCheck, text: 'Images are processed in your browser, not uploaded' },
];

const AuthLayout: React.FC<{ title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-canvas flex">
    {/* Brand panel */}
    <aside className="hidden lg:flex w-[44%] max-w-xl flex-col justify-between bg-ink text-white p-10 xl:p-14 relative overflow-hidden">
      <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-brand-500/15" aria-hidden="true" />
      <div className="absolute right-16 top-24 w-40 h-40 rounded-full bg-brand-500/10" aria-hidden="true" />
      <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg relative" aria-label="Optimizer.pro home">
        <LogoMark />
        <span className="font-bold text-[17px] tracking-tight">Optimizer<span className="text-brand-400">.pro</span></span>
      </Link>
      <div className="relative">
        <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">Smaller images.<br /><span className="text-brand-400">Same quality.</span></h2>
        <ul className="mt-8 space-y-4">
          {POINTS.map(p => (
            <li key={p.text} className="flex items-start gap-3 text-[15px] text-white/80">
              <span className="w-8 h-8 rounded-lg bg-white/10 text-brand-400 flex items-center justify-center shrink-0" aria-hidden="true"><p.icon size={16} /></span>
              <span className="pt-1">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-sm text-white/60">Free to use. No credit card, no subscription.</p>
    </aside>

    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between">
        <span className="lg:invisible"><Logo /></span>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink rounded-md px-2 py-1">
          <ArrowLeft size={15} aria-hidden="true" /> Back to home
        </Link>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-[15px] text-muted mt-2">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  </div>
);

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

const ServiceNotice: React.FC = () => {
  const { serviceError } = useAuth();
  if (!serviceError) return null;
  return <Alert tone="warning" className="mb-4" title="Account service unavailable">{serviceError}</Alert>;
};

// --- Sign in ---

export const SignInPage: React.FC = () => {
  const { login } = useAuth();
  const query = useQuery();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const resetDone = query.get('reset') === '1';
  const next = query.get('next');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(normalizeEmail(email)); if (emailErr) errs.email = emailErr;
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await login(normalizeEmail(email), password, remember);
      navigate(safeNext(next), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to open your workspace."
      footer={<>Don't have an account? <TextLink to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Create one free</TextLink></>}
    >
      <ServiceNotice />
      <form onSubmit={submit} noValidate className="space-y-4">
        {resetDone && <Alert tone="success">Your password was reset. Sign in with your new password.</Alert>}
        {formError && <Alert>{formError}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" autoFocus inputMode="email" />
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          labelAction={<Link to="/forgot-password" className="text-[13px] font-medium text-brand-800 hover:underline">Forgot password?</Link>}
        />
        <Checkbox label="Keep me signed in for 30 days" checked={remember} onChange={setRemember} />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</Button>
      </form>
    </AuthLayout>
  );
};

// --- Sign up ---

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const query = useQuery();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const errs: Record<string, string> = {};
    const n = validateName(name); if (n) errs.name = n;
    const em = validateEmail(normalizeEmail(email)); if (em) errs.email = em;
    const pw = validatePassword(password, normalizeEmail(email)); if (pw) errs.password = pw;
    if (!errs.password && confirm !== password) errs.confirm = 'Passwords do not match.';
    if (!acceptTerms) errs.acceptTerms = 'Please accept the Terms of Service and Privacy Policy.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email: normalizeEmail(email), password, acceptTerms });
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
      footer={<>Already have an account? <TextLink to="/signin">Sign in</TextLink></>}
    >
      <ServiceNotice />
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" autoFocus maxLength={80} />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" inputMode="email" />
        <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters. Avoid common passwords.`} after={<PasswordStrength password={password} />} />
        <PasswordField label="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
        <Checkbox
          checked={acceptTerms}
          onChange={setAcceptTerms}
          error={errors.acceptTerms}
          label={<>I agree to the <a href="/terms" target="_blank" rel="noopener" className="font-semibold text-brand-800 underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-brand-800 underline">Privacy Policy</a>.</>}
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>{submitting ? 'Creating account…' : 'Create free account'}</Button>
        <p className="flex items-start gap-2 text-[13px] text-muted">
          <ShieldCheck size={16} className="text-brand-700 shrink-0 mt-px" aria-hidden="true" />
          Your images stay in your browser. Your account stores your name, email, a hashed password and the sizes of images you optimize.
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
  const [result, setResult] = useState<{ delivery: 'email' | 'server-log' | 'unavailable' } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const em = validateEmail(normalizeEmail(email));
    setError(em);
    if (em) return;
    setSubmitting(true);
    try {
      const res = await authRequest<{ ok: true; delivery: 'email' | 'server-log' | 'unavailable' }>('/forgot-password', { method: 'POST', body: { email: normalizeEmail(email) } });
      setResult({ delivery: res.delivery });
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <AuthLayout title={result.delivery === 'email' ? 'Check your email' : result.delivery === 'server-log' ? 'Reset link created' : 'Password reset unavailable'} footer={<TextLink to="/signin">Back to sign in</TextLink>}>
        {result.delivery === 'email' ? (
          <div className="flex flex-col items-start gap-4">
            <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center" aria-hidden="true"><MailCheck size={22} /></span>
            <p className="text-[15px] text-muted">
              If an account exists for <strong className="text-ink">{normalizeEmail(email)}</strong>, we've sent a link to reset your password. It expires in 60 minutes and works once. Check your spam folder if it doesn't arrive within a few minutes.
            </p>
          </div>
        ) : result.delivery === 'server-log' ? (
          <Alert tone="info" title="Development mode">
            If an account exists for <strong>{normalizeEmail(email)}</strong>, a reset link has been created. No email provider is configured, so the link was written to the server log. It expires in one hour.
          </Alert>
        ) : (
          <Alert tone="warning">
            Password reset by email isn't set up on this deployment yet, so no email was sent. Please contact the site administrator to regain access to your account.
          </Alert>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email address you signed up with and we'll send you a reset link."
      footer={<>Remembered it? <TextLink to="/signin">Sign in</TextLink></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" autoFocus inputMode="email" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>Send reset link</Button>
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
    if (submitting) return;
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
      <AuthLayout title="Invalid reset link" footer={<TextLink to="/forgot-password">Request a new link</TextLink>}>
        <Alert>This password reset link is missing its token. Request a new link and try again.</Alert>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-start gap-4">
          <CheckCircle2 size={40} className="text-brand-700" aria-hidden="true" />
          <p className="text-[15px] text-muted">Your password has been changed and all existing sessions were signed out.</p>
          <Button size="lg" className="w-full mt-2" onClick={() => navigate('/signin?reset=1', { replace: true })}>Continue to sign in</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" footer={<TextLink to="/signin">Back to sign in</TextLink>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}{' '}<Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>.</Alert>}
        <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" autoFocus hint={`At least ${PASSWORD_MIN} characters.`} after={<PasswordStrength password={password} />} />
        <PasswordField label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>Update password</Button>
      </form>
    </AuthLayout>
  );
};
