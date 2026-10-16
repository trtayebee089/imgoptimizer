import React, { useId, useState } from 'react';
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { Link } from '../lib/router';

// --- Brand ---

export const Logo: React.FC<{ to?: string; className?: string }> = ({ to = '/', className = '' }) => (
  <Link to={to} className={`inline-flex items-center gap-2.5 rounded-lg ${className}`} aria-label="Optimizer.pro home">
    <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0" aria-hidden="true">
      <Zap size={17} className="text-white" fill="currentColor" />
    </span>
    <span className="font-display font-bold text-[17px] tracking-tight text-ink">
      Optimizer<span className="text-brand-500">.pro</span>
    </span>
  </Link>
);

// --- Buttons ---

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-card disabled:bg-brand-300',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-canvas hover:border-subtle disabled:text-subtle',
  ghost: 'text-muted hover:text-ink hover:bg-canvas disabled:text-subtle',
  danger: 'bg-white text-danger-600 border border-line-strong hover:bg-danger-50 hover:border-danger-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, type = 'button', ...rest }: ButtonProps) => (
  <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)} {...rest}>
    {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

type LinkButtonProps = { to: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode };
export const LinkButton: React.FC<LinkButtonProps> = ({ to, variant = 'primary', size = 'md', className = '', children }: LinkButtonProps) => (
  <Link to={to} className={buttonClass(variant, size, className)}>{children}</Link>
);

// --- Form fields ---

const inputBase = 'block w-full h-11 rounded-lg border bg-white px-3.5 text-[15px] text-ink placeholder:text-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-canvas disabled:text-muted';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: React.ReactNode;
  labelAction?: React.ReactNode;
};

export const TextField: React.FC<FieldProps> = ({ label, error, hint, labelAction, id, className = '', ...rest }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  const describedBy = [error ? `${fieldId}-error` : '', hint ? `${fieldId}-hint` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">{label}</label>
        {labelAction}
      </div>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputBase} ${error ? 'border-danger-500 focus:border-danger-500' : 'border-line-strong focus:border-brand-500'}`}
        {...rest}
      />
      {hint && !error && <p id={`${fieldId}-hint`} className="mt-1.5 text-[13px] text-muted">{hint}</p>}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-[13px] text-danger-600 flex items-start gap-1.5">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  );
};

export const PasswordField: React.FC<Omit<FieldProps, 'type'>> = ({ label, error, hint, labelAction, id, className = '', ...rest }) => {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;
  const describedBy = [error ? `${fieldId}-error` : '', hint ? `${fieldId}-hint` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} pr-11 ${error ? 'border-danger-500 focus:border-danger-500' : 'border-line-strong focus:border-brand-500'}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={fieldId}
          className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-muted hover:text-ink rounded-r-lg"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && <p id={`${fieldId}-hint`} className="mt-1.5 text-[13px] text-muted">{hint}</p>}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-[13px] text-danger-600 flex items-start gap-1.5">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  );
};

export const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; id?: string }> = ({ label, checked, onChange, id }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} className="inline-flex items-center gap-2.5 text-sm text-ink cursor-pointer select-none">
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-line-strong text-brand-500 accent-[#2965F1] focus:ring-brand-500"
      />
      {label}
    </label>
  );
};

// --- Feedback ---

const ALERT_STYLES = {
  error: { box: 'bg-danger-50 border-danger-500/30 text-danger-700', Icon: AlertCircle },
  success: { box: 'bg-success-50 border-success-500/30 text-success-700', Icon: CheckCircle2 },
  info: { box: 'bg-brand-50 border-brand-200 text-brand-800', Icon: Info },
  warning: { box: 'bg-warning-50 border-warning-500/30 text-warning-700', Icon: AlertCircle },
};

export const Alert: React.FC<{ tone?: keyof typeof ALERT_STYLES; children: React.ReactNode; className?: string }> = ({ tone = 'error', children, className = '' }) => {
  const { box, Icon } = ALERT_STYLES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${box} ${className}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

export const FullPageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="min-h-screen flex items-center justify-center bg-canvas" role="status" aria-live="polite">
    <Loader2 size={28} className="animate-spin text-brand-500" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

export const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};
