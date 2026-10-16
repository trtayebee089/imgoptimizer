import React, { useEffect, useState } from 'react';
import {
  Menu, X, ArrowRight, UploadCloud, SlidersHorizontal, Download, WandSparkles, FileImage, Gauge, Layers,
  Ruler, ShieldCheck, Columns2, ClipboardPaste, CheckCircle2, ChevronDown, Target, Percent,
} from 'lucide-react';
import { Link } from '../lib/router';
import { useAuth } from '../lib/auth';
import { Logo, LinkButton, buttonClass } from '../components/ui';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

// --- Navigation ---

const LandingNav: React.FC = () => {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const signedIn = status === 'authenticated';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-line">
      <div className="max-w-page mx-auto h-16 px-4 sm:px-6 flex items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:flex items-center gap-1 ml-4">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-canvas">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-2">
          {signedIn ? (
            <LinkButton to="/app">Open workspace <ArrowRight size={16} aria-hidden="true" /></LinkButton>
          ) : (
            <>
              <Link to="/login" className={buttonClass('ghost')}>Log in</Link>
              <LinkButton to="/signup">Get Started Free</LinkButton>
            </>
          )}
        </div>
        <button
          type="button"
          className="md:hidden ml-auto w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-ink hover:bg-canvas"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="md:hidden border-t border-line bg-white px-4 pb-5 pt-2">
          <nav aria-label="Main" className="flex flex-col">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-[15px] font-medium text-ink border-b border-line">{l.label}</a>
            ))}
          </nav>
          <div className="grid gap-2 mt-4">
            {signedIn ? (
              <LinkButton to="/app" size="lg" className="w-full">Open workspace</LinkButton>
            ) : (
              <>
                <LinkButton to="/signup" size="lg" className="w-full">Get Started Free</LinkButton>
                <LinkButton to="/login" size="lg" variant="secondary" className="w-full">Log in</LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// --- Product preview (static illustration of the real workspace) ---
// Figures come from actual runs of the optimizer with the default "Balanced" WebP settings.

const PREVIEW_ROWS = [
  { name: 'product-photo.jpg', from: 'JPG', before: '3.3 MB', after: '98.4 KB', saved: 97, dims: '3000×2000 → 1125×750', tone: 'from-sky-300 to-amber-200' },
  { name: 'team-offsite.webp', from: 'WEBP', before: '950.1 KB', after: '158.8 KB', saved: 83, dims: '1800×1200 → 1125×750', tone: 'from-indigo-300 to-orange-200' },
  { name: 'feature-diagram.png', from: 'PNG', before: '50.3 KB', after: '19.9 KB', saved: 61, dims: '1600×1000', tone: 'from-emerald-200 to-rose-200' },
];

const MiniSlider: React.FC<{ label: string; value: string; pct: number }> = ({ label, value, pct }) => (
  <div>
    <div className="flex justify-between text-[11px]"><span className="font-medium text-ink">{label}</span><span className="font-semibold text-ink tabular-nums">{value}</span></div>
    <div className="mt-1.5 h-1.5 rounded-full bg-line relative">
      <div className="absolute inset-y-0 left-0 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-brand-500" style={{ left: `calc(${pct}% - 6px)` }} />
    </div>
  </div>
);

const ProductPreview: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className="relative" role="img" aria-label="Preview of the Optimizer.pro workspace showing three optimized images and the settings panel">
    <div aria-hidden="true" className="rounded-2xl border border-line bg-white shadow-overlay overflow-hidden text-left select-none">
      {/* window chrome */}
      <div className="h-9 bg-canvas border-b border-line flex items-center gap-1.5 px-3">
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" /><span className="w-2.5 h-2.5 rounded-full bg-line-strong" /><span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 text-[11px] text-muted">optimizer.pro/app</span>
      </div>
      <div className="flex">
        <div className="flex-1 min-w-0 p-3 sm:p-4 bg-canvas">
          <div className="flex items-center justify-between bg-white border border-line rounded-lg px-3 py-2 mb-2.5">
            <span className="flex items-center gap-1.5 text-[11px] text-ink"><CheckCircle2 size={13} className="text-success-500" /> <b>3</b> of 3 images done <span className="text-muted hidden sm:inline">· saved 4.0 MB (94%)</span></span>
            <span className="text-[10px] font-semibold text-white bg-brand-500 rounded-md px-2 py-1">Download ZIP</span>
          </div>
          <div className="space-y-2">
            {PREVIEW_ROWS.map(r => (
              <div key={r.name} className="bg-white border border-line rounded-lg p-2.5 flex gap-2.5">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-gradient-to-br ${r.tone} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-ink truncate">{r.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] sm:text-[11px]">
                    <span className="text-muted">{r.from} → <b className="text-brand-600">WEBP</b></span>
                    <span className="text-muted line-through">{r.before}</span>
                    <span className="font-semibold text-ink">{r.after}</span>
                    <span className="px-1 rounded bg-success-50 text-success-700 font-semibold">−{r.saved}%</span>
                    {!compact && <span className="text-muted hidden lg:inline">{r.dims} px</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden sm:block w-44 lg:w-48 shrink-0 border-l border-line p-3 space-y-3">
          <p className="text-[11px] font-semibold text-ink flex items-center gap-1.5"><SlidersHorizontal size={12} className="text-brand-500" /> Settings</p>
          <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-canvas border border-line rounded-md text-[10px] font-semibold text-center">
            <span className="bg-white rounded py-1 text-brand-600 shadow-card">Smart</span><span className="py-1 text-muted">Basic</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-canvas border border-line rounded-md text-[10px] font-semibold text-center">
            <span className="bg-white rounded py-1 text-brand-600 shadow-card">WebP</span><span className="py-1 text-muted">JPEG</span><span className="py-1 text-muted">PNG</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px] font-semibold text-center">
            <span className="border border-line rounded py-1 text-ink">Web</span>
            <span className="border border-brand-500 bg-brand-50 rounded py-1 text-brand-700">Balanced</span>
            <span className="border border-line rounded py-1 text-ink">High</span>
          </div>
          <MiniSlider label="Target size" value="100 KB" pct={9} />
          <MiniSlider label="Quality floor" value="75%" pct={72} />
          <MiniSlider label="Minimum edge" value="750 px" pct={22} />
        </div>
      </div>
    </div>
  </div>
);

// --- Sections ---

const FEATURES = [
  { icon: WandSparkles, title: 'Smart optimization', body: 'Compresses, measures and adjusts in a loop — lowering quality, then dimensions — until each image fits your target size.' },
  { icon: FileImage, title: 'WebP, JPEG and PNG', body: 'Convert to WebP for the smallest files, or export JPEG and PNG. Accepts any image format your browser can open.' },
  { icon: Gauge, title: 'Quality and size controls', body: 'Set a target file size and a quality floor, or pick the Web, Balanced or High quality profile.' },
  { icon: Ruler, title: 'Dimension limits', body: 'Keep the shorter side above a minimum edge, or set separate minimum width and height. Images are never enlarged.' },
  { icon: Layers, title: 'Batch processing', body: 'Queue as many images as you like, rename them in bulk, and download everything as a ZIP or as separate files.' },
  { icon: ShieldCheck, title: 'Processed in your browser', body: 'Images are optimized locally with your browser’s Canvas API. Image files are not uploaded to our server.' },
  { icon: Columns2, title: 'Before / after compare', body: 'Inspect every result with a side-by-side slider before you download it.' },
  { icon: ClipboardPaste, title: 'Paste and copy', body: 'Paste images straight from your clipboard, and copy optimized results back with one click.' },
];

const CAPABILITIES = [
  { icon: UploadCloud, label: 'Drag-and-drop uploads' },
  { icon: FileImage, label: 'WebP conversion' },
  { icon: WandSparkles, label: 'Smart optimization' },
  { icon: Percent, label: 'Quality floor control' },
  { icon: Target, label: 'Target file size' },
  { icon: Ruler, label: 'Minimum dimensions' },
  { icon: Download, label: 'Output size and savings' },
];

const STEPS = [
  { icon: UploadCloud, title: 'Upload your images', body: 'Drop files onto the workspace, paste from your clipboard, or browse your device. Add one image or a whole folder’s worth.' },
  { icon: SlidersHorizontal, title: 'Choose your settings', body: 'Pick an output format and a profile, or fine-tune target size, quality floor and minimum dimensions.' },
  { icon: Download, title: 'Optimize and download', body: 'Images are processed one by one. Compare results, then download individual files or a single ZIP.' },
];

const FAQS = [
  { id: 'faq-free', q: 'Is Optimizer.pro free?', a: 'Yes. Optimizer.pro is free to use, and every optimizer feature is available on the free plan. Creating an account doesn’t require payment details.' },
  { id: 'faq-formats', q: 'Which formats are supported?', a: 'You can add any image your browser can decode — typically JPG, PNG, WebP, GIF and AVIF. Results are saved as WebP, JPEG or PNG.' },
  { id: 'faq-quality', q: 'Will my images lose quality?', a: 'WebP and JPEG are lossy formats, so some detail is traded for size. You stay in control: quality never drops below the floor you set, and you can compare each result with the original before downloading. PNG output is lossless.' },
  { id: 'faq-target', q: 'Is the target size guaranteed?', a: 'The target is a goal. If your quality floor and minimum dimensions don’t allow an image to get that small, you receive the smallest result within those limits, and every step taken is shown in the results.' },
  { id: 'faq-privacy', q: 'Are my images uploaded to a server?', a: 'No. Images are processed entirely in your browser and are not uploaded. After each image is processed, the app records anonymous totals (files processed and bytes saved) for the public statistics. Your account stores your name, email address and a hashed password.' },
  { id: 'faq-account', q: 'Why do I need an account?', a: 'The workspace is available to signed-in users. Sign-up is free, takes a few seconds, and only asks for your name, email address and a password.' },
];

const SectionHeading: React.FC<{ eyebrow: string; title: string; body?: string }> = ({ eyebrow, title, body }) => (
  <div className="max-w-2xl mx-auto text-center mb-10 md:mb-14">
    <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>
    <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-ink">{title}</h2>
    {body && <p className="mt-4 text-base md:text-lg text-muted">{body}</p>}
  </div>
);

export const LandingPage: React.FC = () => {
  const { status } = useAuth();
  const ctaTo = status === 'authenticated' ? '/app' : '/signup';
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-raised">Skip to content</a>
      <LandingNav />

      <main id="main">
        {/* Hero */}
        <section className="bg-white border-b border-line">
          <div className="max-w-page mx-auto px-4 sm:px-6 pt-14 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-700">
                <CheckCircle2 size={14} aria-hidden="true" /> Free to use · No credit card required
              </span>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[44px] xl:text-[52px] leading-[1.08] font-extrabold tracking-tight text-ink">
                Optimize Every Image.<br className="hidden sm:block" /> <span className="text-brand-500">Keep Every Detail.</span>
              </h1>
              <p className="mt-5 text-lg text-muted max-w-xl mx-auto lg:mx-0">
                Compress, convert, and optimize your images with precision. Fine-tune quality, target file sizes, and output formats in one powerful workspace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <LinkButton to={ctaTo} size="lg">Start Optimizing Free <ArrowRight size={18} aria-hidden="true" /></LinkButton>
                <a href="#features" className={buttonClass('secondary', 'lg')}>Explore Features</a>
              </div>
              <p className="mt-5 text-sm text-muted flex items-center gap-2 justify-center lg:justify-start">
                <ShieldCheck size={16} className="text-brand-500" aria-hidden="true" /> Images are processed in your browser — never uploaded.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Product capabilities */}
        <section aria-labelledby="preview-heading" className="py-16 md:py-24">
          <div className="max-w-page mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <p className="text-sm font-semibold text-brand-600">The workspace</p>
              <h2 id="preview-heading" className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-ink">Everything in one focused view</h2>
              <p className="mt-4 text-base md:text-lg text-muted">Your queue and results on the left, every optimization setting on the right. No tabs to dig through.</p>
            </div>
            <ul className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
              {CAPABILITIES.map(c => (
                <li key={c.label} className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-3.5 py-2 text-sm font-medium text-ink shadow-card">
                  <c.icon size={16} className="text-brand-500" aria-hidden="true" />{c.label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-16 md:py-24 bg-white border-y border-line">
          <div className="max-w-page mx-auto px-4 sm:px-6">
            <SectionHeading eyebrow="Features" title="Precise control over every image" body="Built for people who care about both page speed and image quality." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(f => (
                <div key={f.title} className="rounded-xl border border-line bg-white p-6 hover:border-brand-200 hover:shadow-raised transition-shadow">
                  <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center" aria-hidden="true"><f.icon size={20} /></span>
                  <h3 className="mt-4 text-base font-semibold text-ink font-sans">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-16 md:py-24">
          <div className="max-w-page mx-auto px-4 sm:px-6">
            <SectionHeading eyebrow="How it works" title="Three steps to lighter images" />
            <ol className="grid md:grid-cols-3 gap-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative rounded-xl bg-white border border-line p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                    <s.icon size={20} className="text-brand-500" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink font-sans"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-16 md:py-24 bg-white border-y border-line">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
            <div className="divide-y divide-line border-y border-line">
              {FAQS.map(f => (
                <details key={f.id} id={f.id} className="group scroll-mt-24">
                  <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer text-left text-base font-semibold text-ink rounded-md">
                    {f.q}
                    <ChevronDown size={20} className="text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-5 -mt-1 text-[15px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24">
          <div className="max-w-page mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-ink px-6 py-12 md:px-12 md:py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Start optimizing your images today</h2>
              <p className="mt-4 text-base md:text-lg text-white/70 max-w-xl mx-auto">Create a free account and open the workspace in seconds. No credit card required.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <LinkButton to={ctaTo} size="lg">{status === 'authenticated' ? 'Open workspace' : 'Get Started Free'} <ArrowRight size={18} aria-hidden="true" /></LinkButton>
                {status !== 'authenticated' && (
                  <Link to="/login" className="inline-flex items-center justify-center h-12 px-6 rounded-xl text-[15px] font-semibold text-white border border-white/25 hover:bg-white/10">Log in</Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-line">
        <div className="max-w-page mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted max-w-xs">Free image compression and conversion that runs in your browser.</p>
          </div>
          <nav aria-label="Product">
            <h2 className="text-sm font-semibold text-ink font-sans">Product</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#features" className="text-muted hover:text-ink">Features</a></li>
              <li><a href="#how-it-works" className="text-muted hover:text-ink">How it works</a></li>
              <li><a href="#faq" className="text-muted hover:text-ink">FAQ</a></li>
              <li><a href="#faq-privacy" onClick={() => { const d = document.getElementById('faq-privacy') as HTMLDetailsElement | null; if (d) d.open = true; }} className="text-muted hover:text-ink">Privacy</a></li>
            </ul>
          </nav>
          <nav aria-label="Account">
            <h2 className="text-sm font-semibold text-ink font-sans">Account</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {status === 'authenticated' ? (
                <li><Link to="/app" className="text-muted hover:text-ink">Open workspace</Link></li>
              ) : (
                <>
                  <li><Link to="/signup" className="text-muted hover:text-ink">Sign up</Link></li>
                  <li><Link to="/login" className="text-muted hover:text-ink">Log in</Link></li>
                  <li><Link to="/forgot-password" className="text-muted hover:text-ink">Reset password</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <div className="border-t border-line">
          <p className="max-w-page mx-auto px-4 sm:px-6 py-5 text-[13px] text-muted">© {year} Optimizer.pro</p>
        </div>
      </footer>
    </div>
  );
};
