import React, { useEffect, useId, useRef, useState } from 'react';
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { Link } from '../lib/router';

// --- Brand ---

export const Logo: React.FC<{ to?: string; className?: string }> = ({ to = '/', className = '' }) => (
  <Link to={to} className={`inline-flex items-center gap-2.5 rounded-lg ${className}`} aria-label="Optimizer.pro home">
    <LogoMark />
    <span className="font-bold text-[17px] tracking-tight text-ink">
      Optimizer<span className="text-brand-700">.pro</span>
    </span>
  </Link>
);

export const LogoMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <span className="rounded-lg bg-brand-500 flex items-center justify-center shrink-0" style={{ width: size, height: size }} aria-hidden="true">
    <Zap size={Math.round(size * 0.53)} className="text-on-brand" fill="currentColor" />
  </span>
);

// --- Buttons ---

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-500 text-on-brand hover:bg-brand-600 active:bg-brand-600 shadow-card disabled:bg-brand-200 disabled:text-on-brand/60',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-canvas hover:border-subtle disabled:text-subtle',
  ghost: 'text-muted hover:text-ink hover:bg-ink/[0.04] disabled:text-subtle',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-500/50',
  dark: 'bg-ink text-white hover:bg-ink/90 disabled:bg-ink/50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  `inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', size = 'md', loading, disabled, className = '', children, type = 'button', ...rest }: ButtonProps, ref) => (
  <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)} {...rest}>
    {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
    {children}
  </button>
));
Button.displayName = 'Button';

type LinkButtonProps = { to: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode };
export const LinkButton: React.FC<LinkButtonProps> = ({ to, variant = 'primary', size = 'md', className = '', children }: LinkButtonProps) => (
  <Link to={to} className={buttonClass(variant, size, className)}>{children}</Link>
);

export const TextLink: React.FC<{ to: string; className?: string; children: React.ReactNode }> = ({ to, className = '', children }) => (
  <Link to={to} className={`font-semibold text-brand-800 underline-offset-2 hover:underline ${className}`}>{children}</Link>
);

// --- Form fields ---

const inputBase = 'block w-full h-11 rounded-lg border bg-white px-3.5 text-[15px] text-ink placeholder:text-subtle transition-shadow focus:outline-none focus:shadow-focus disabled:bg-canvas disabled:text-muted';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: React.ReactNode;
  labelAction?: React.ReactNode;
  after?: React.ReactNode;
};

const FieldMessages: React.FC<{ id: string; error?: string | null; hint?: React.ReactNode }> = ({ id, error, hint }) => (
  <>
    {hint && !error && <div id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted">{hint}</div>}
    {error && (
      <p id={`${id}-error`} className="mt-1.5 text-[13px] text-danger-600 flex items-start gap-1.5">
        <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}
      </p>
    )}
  </>
);

const describedBy = (id: string, error?: string | null, hint?: React.ReactNode) =>
  [error ? `${id}-error` : '', hint && !error ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;

export const TextField: React.FC<FieldProps> = ({ label, error, hint, labelAction, after, id, className = '', ...rest }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">{label}</label>
        {labelAction}
      </div>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={`${inputBase} ${error ? 'border-danger-500' : 'border-line-strong focus:border-brand-600'}`}
        {...rest}
      />
      {after}
      <FieldMessages id={fieldId} error={error} hint={hint} />
    </div>
  );
};

export const PasswordField: React.FC<Omit<FieldProps, 'type'>> = ({ label, error, hint, labelAction, after, id, className = '', ...rest }) => {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;
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
          aria-describedby={describedBy(fieldId, error, hint)}
          className={`${inputBase} pr-11 ${error ? 'border-danger-500' : 'border-line-strong focus:border-brand-600'}`}
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
      {after}
      <FieldMessages id={fieldId} error={error} hint={hint} />
    </div>
  );
};

export const Checkbox: React.FC<{ label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; id?: string; error?: string | null; className?: string }> = ({ label, checked, onChange, id, error, className = '' }) => {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5 text-sm text-ink">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="mt-0.5 w-4 h-4 shrink-0 rounded border-line-strong accent-[#218838] cursor-pointer"
        />
        <label htmlFor={fieldId} className="cursor-pointer select-none leading-snug">{label}</label>
      </div>
      <FieldMessages id={fieldId} error={error} />
    </div>
  );
};

// --- Surfaces ---

export const Card: React.FC<{ className?: string; children: React.ReactNode; as?: 'div' | 'section' | 'li' } & React.HTMLAttributes<HTMLElement>> = ({ className = '', children, as: Tag = 'div', ...rest }) => (
  <Tag className={`bg-white border border-line rounded-xl shadow-card ${className}`} {...rest}>{children}</Tag>
);

export const SectionCard: React.FC<{ title: string; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, description, action, children, className = '' }) => (
  <section className={`bg-white border border-line rounded-xl shadow-card ${className}`}>
    <div className="px-5 md:px-6 py-4 border-b border-line flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
    <div className="px-5 md:px-6 py-5">{children}</div>
  </section>
);

export const PageHeader: React.FC<{ title: string; description?: React.ReactNode; actions?: React.ReactNode }> = ({ title, description, actions }) => (
  <header className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8">
    <div className="min-w-0">
      <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-ink">{title}</h1>
      {description && <p className="text-sm md:text-[15px] text-muted mt-1.5 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

const BADGE_TONES = {
  neutral: 'bg-canvas text-muted border-line',
  brand: 'bg-brand-50 text-brand-800 border-brand-200',
  success: 'bg-success-50 text-success-700 border-brand-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-500/25',
  danger: 'bg-danger-50 text-danger-700 border-danger-500/25',
};

export const Badge: React.FC<{ tone?: keyof typeof BADGE_TONES; className?: string; children: React.ReactNode }> = ({ tone = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${BADGE_TONES[tone]} ${className}`}>{children}</span>
);

export const EmptyState: React.FC<{ icon: React.ElementType; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }> = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center text-center px-6 py-12 ${className}`}>
    <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center" aria-hidden="true"><Icon size={22} /></span>
    <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
    {description && <p className="mt-1.5 text-sm text-muted max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const StatCard: React.FC<{ label: string; value: string; detail?: React.ReactNode; icon: React.ElementType; loading?: boolean }> = ({ label, value, detail, icon: Icon, loading }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-muted">{label}</p>
      <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0" aria-hidden="true"><Icon size={18} /></span>
    </div>
    {loading
      ? <div className="mt-3 h-8 w-24 rounded-md bg-canvas animate-pulse" aria-hidden="true" />
      : <p className="mt-3 text-2xl md:text-[28px] font-bold tracking-tight text-ink tabular-nums">{value}</p>}
    {detail && <p className="mt-1 text-[13px] text-muted">{detail}</p>}
  </Card>
);

// --- Feedback ---

const ALERT_STYLES = {
  error: { box: 'bg-danger-50 border-danger-500/30 text-danger-700', Icon: AlertCircle },
  success: { box: 'bg-success-50 border-brand-200 text-success-700', Icon: CheckCircle2 },
  info: { box: 'bg-white border-line text-ink', Icon: Info },
  warning: { box: 'bg-warning-50 border-warning-500/30 text-warning-700', Icon: AlertCircle },
};

export const Alert: React.FC<{ tone?: keyof typeof ALERT_STYLES; children: React.ReactNode; className?: string; title?: string }> = ({ tone = 'error', children, className = '', title }) => {
  const { box, Icon } = ALERT_STYLES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${box} ${className}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children}
      </div>
    </div>
  );
};

export const FullPageSpinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="min-h-screen flex items-center justify-center bg-canvas" role="status" aria-live="polite">
    <Loader2 size={28} className="animate-spin text-brand-700" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

/** Modal dialog with focus trap, Escape to close and focus restore. */
export const Dialog: React.FC<{ open: boolean; onClose: () => void; title: string; description?: React.ReactNode; children: React.ReactNode; size?: 'sm' | 'md' }> = ({ open, onClose, title, description, children, size = 'sm' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const close = () => onCloseRef.current();
    const previous = document.activeElement as HTMLElement | null;
    const focusables = (): HTMLElement[] => {
      const list = ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      return list ? (Array.prototype.slice.call(list) as HTMLElement[]).filter(el => !el.hasAttribute('disabled')) : [];
    };
    (ref.current?.querySelector<HTMLElement>('[autofocus], input') || focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const els = focusables();
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className={`relative w-full ${size === 'md' ? 'sm:max-w-lg' : 'sm:max-w-md'} bg-white rounded-t-2xl sm:rounded-2xl shadow-overlay p-6 max-h-[92vh] overflow-y-auto animate-op-fade-up`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink">{title}</h2>
            {description && <div className="text-sm text-muted mt-1">{description}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-canvas shrink-0">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
};

export const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes || !Number.isFinite(bytes)) return '0 B';
  const sign = bytes < 0 ? '−' : '';
  const abs = Math.abs(bytes);
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.max(0, Math.min(sizes.length - 1, Math.floor(Math.log(abs) / Math.log(k))));
  return sign + parseFloat((abs / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};
