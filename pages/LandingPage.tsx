import React, { useEffect, useState } from 'react';
import {
  Menu, X, ArrowRight, UploadCloud, SlidersHorizontal, Download, Wand2, FileImage, Layers, ScanSearch,
  ShieldCheck, Columns2, CheckCircle2, ChevronDown, Target, Gauge, FolderDown, Eye, MousePointerClick, Sparkles,
} from 'lucide-react';
import { Link, useLocation } from '../lib/router';
import { useAuth } from '../lib/auth';
import { Logo, LinkButton, buttonClass, Alert } from '../components/ui';
import { MAX_FILES_PER_ADD, MAX_FILE_BYTES } from '../lib/fileValidation';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#benefits', label: 'Benefits' },
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
    <header className="sticky top-0 z-50 bg-canvas/85 backdrop-blur border-b border-line/80">
      <div className="max-w-page mx-auto h-16 px-4 sm:px-6 flex items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:flex items-center gap-1 ml-4">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-ink/[0.04]">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-2">
          {signedIn ? (
            <LinkButton to="/app">Open Dashboard <ArrowRight size={16} aria-hidden="true" /></LinkButton>
          ) : (
            <>
              <Link to="/signin" className={buttonClass('ghost')}>Sign In</Link>
              <LinkButton to="/signup">Get Started Free</LinkButton>
            </>
          )}
        </div>
        <button
          type="button"
          className="md:hidden ml-auto w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-ink hover:bg-ink/[0.04]"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="md:hidden border-t border-line bg-white px-4 pb-5 pt-2 shadow-raised">
          <nav aria-label="Main" className="flex flex-col">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-[15px] font-medium text-ink border-b border-line">{l.label}</a>
            ))}
          </nav>
          <div className="grid gap-2 mt-4">
            {signedIn ? (
              <LinkButton to="/app" size="lg" className="w-full">Open Dashboard</LinkButton>
            ) : (
              <>
                <LinkButton to="/signup" size="lg" className="w-full">Get Started Free</LinkButton>
                <LinkButton to="/signin" size="lg" variant="secondary" className="w-full">Sign In</LinkButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// --- Product preview (static illustration of the real workspace) ---
// Example figures from runs of the optimizer with the default "Balanced" WebP settings.
// Illustrative only — never stored or shown as anyone's statistics.

const PREVIEW_ROWS = [
  { name: 'product-photo.jpg', from: 'JPEG', before: '3.3 MB', after: '98.4 KB', saved: 97, dims: '3000×2000 → 1125×750', tone: 'from-emerald-200 via-lime-100 to-amber-100', state: 'done' },
  { name: 'team-offsite.webp', from: 'WebP', before: '950.1 KB', after: '158.8 KB', saved: 83, dims: '1800×1200 → 1125×750', tone: 'from-sky-200 via-emerald-100 to-lime-100', state: 'done' },
  { name: 'feature-diagram.png', from: 'PNG', before: '50.3 KB', after: '', saved: 0, dims: '1600×1000', tone: 'from-stone-200 to-emerald-100', state: 'processing' },
];

const MiniSlider: React.FC<{ label: string; value: string; pct: number }> = ({ label, value, pct }) => (
  <div>
    <div className="flex justify-between text-[11px]"><span className="font-medium text-ink">{label}</span><span className="font-semibold text-ink tabular-nums">{value}</span></div>
    <div className="mt-1.5 h-1.5 rounded-full bg-line relative">
      <div className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-brand-700" style={{ left: `calc(${pct}% - 6px)` }} />
    </div>
  </div>
);

const ProductPreview: React.FC = () => (
  <figure className="relative" aria-label="Illustration of the Optimizer.pro workspace: two images optimized to WebP, a third in progress, and the settings panel">
    <div aria-hidden="true" className="rounded-2xl border border-line bg-white shadow-overlay overflow-hidden text-left select-none">
      <div className="h-9 bg-canvas border-b border-line flex items-center gap-1.5 px-3">
        <span className="w-2.5 h-2.5 rounded-full bg-line-strong" /><span className="w-2.5 h-2.5 rounded-full bg-line-strong" /><span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 text-[11px] text-muted">Image Optimizer</span>
      </div>
      <div className="flex">
        <div className="flex-1 min-w-0 p-3 sm:p-4 bg-canvas">
          <div className="flex items-center justify-between bg-white border border-line rounded-lg px-3 py-2 mb-2.5">
            <span className="flex items-center gap-1.5 text-[11px] text-ink"><CheckCircle2 size={13} className="text-brand-700" /> <b>2</b> of 3 done <span className="text-muted hidden sm:inline">· saved 4.0 MB</span></span>
            <span className="text-[10px] font-semibold text-on-brand bg-brand-500 rounded-md px-2 py-1">Download ZIP</span>
          </div>
          <div className="space-y-2">
            {PREVIEW_ROWS.map(r => (
              <div key={r.name} className="bg-white border border-line rounded-lg p-2.5 flex gap-2.5">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-gradient-to-br ${r.tone} shrink-0 ${r.state === 'processing' ? 'opacity-50' : ''}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] sm:text-xs font-semibold text-ink truncate">{r.name}</p>
                    {r.state === 'done'
                      ? <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-brand-50 text-brand-800 border border-brand-200">Optimized</span>
                      : <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-canvas text-muted border border-line">Optimizing</span>}
                  </div>
                  {r.state === 'done' ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] sm:text-[11px]">
                      <span className="text-muted">{r.from} → <b className="text-brand-800">WEBP</b></span>
                      <span className="text-muted line-through">{r.before}</span>
                      <span className="font-semibold text-ink">{r.after}</span>
                      <span className="px-1 rounded bg-brand-50 text-brand-800 font-semibold">−{r.saved}%</span>
                      <span className="text-muted hidden lg:inline">{r.dims} px</span>
                    </div>
                  ) : (
                    <div className="mt-2 h-1 w-32 rounded-full bg-brand-100 overflow-hidden"><div className="h-full w-1/3 bg-brand-600 rounded-full animate-op-indeterminate" /></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden sm:block w-44 lg:w-48 shrink-0 border-l border-line p-3 space-y-3">
          <p className="text-[11px] font-semibold text-ink flex items-center gap-1.5"><SlidersHorizontal size={12} className="text-brand-700" /> Settings</p>
          <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-canvas border border-line rounded-md text-[10px] font-semibold text-center">
            <span className="bg-white rounded py-1 text-brand-800 shadow-card">Smart</span><span className="py-1 text-muted">Basic</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-canvas border border-line rounded-md text-[10px] font-semibold text-center">
            <span className="bg-white rounded py-1 text-brand-800 shadow-card">WebP</span><span className="py-1 text-muted">JPEG</span><span className="py-1 text-muted">PNG</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px] font-semibold text-center">
            <span className="border border-line rounded py-1 text-ink">Web</span>
            <span className="border border-brand-600 bg-brand-50 rounded py-1 text-brand-800">Balanced</span>
            <span className="border border-line rounded py-1 text-ink">High</span>
          </div>
          <MiniSlider label="Target size" value="100 KB" pct={9} />
          <MiniSlider label="Quality floor" value="75%" pct={72} />
          <MiniSlider label="Minimum edge" value="750 px" pct={22} />
        </div>
      </div>
    </div>
    <figcaption className="mt-3 text-center text-xs text-muted">Illustrative example. Actual results depend on your images and settings.</figcaption>
  </figure>
);

// --- Content ---

const FEATURES = [
  { icon: Target, title: 'Smart target-size compression', desc: 'Set a file size. Smart mode compresses, measures and adjusts quality and dimensions until the image fits — within the quality floor and minimum size you choose.' },
  { icon: ScanSearch, title: 'Smart selection', desc: 'Images already under your target are flagged for review, so you decide whether to optimize them or keep the original. Nothing is re-encoded without reason.' },
  { icon: FileImage, title: 'WebP conversion', desc: 'Convert JPEG, PNG, GIF, AVIF and other images to lightweight WebP — or to JPEG or PNG when you need them.' },
  { icon: Gauge, title: 'Large image compression', desc: `Multi-megapixel photos are scaled down by whole-number factors first, then fine-tuned. Files up to ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB are supported.` },
  { icon: Columns2, title: 'Before-and-after comparison', desc: 'Every result shows original and optimized size, bytes saved and percentage. Drag a slider to compare the images side by side.' },
  { icon: Layers, title: 'Batch processing', desc: `Add up to ${MAX_FILES_PER_ADD} images at a time by drag and drop, file picker or paste. They're processed one after another with your settings.` },
  { icon: FolderDown, title: 'Individual or bulk downloads', desc: 'Download one image, a selection, or everything as a ZIP. Rename files individually or in bulk before you download.' },
  { icon: ShieldCheck, title: 'Private by design', desc: 'Images are decoded and encoded in your browser with the Canvas API. They are not uploaded to our servers.' },
];

const STEPS = [
  { icon: UploadCloud, title: 'Add your images', desc: 'Drop files, paste from the clipboard, or browse your device.' },
  { icon: ScanSearch, title: 'Review the selection', desc: 'Images already within your target are flagged so you can keep or optimize them.' },
  { icon: SlidersHorizontal, title: 'Choose your settings', desc: 'Pick Smart or Basic mode, an output format, and a profile — or fine-tune target size, quality floor and dimensions.' },
  { icon: Wand2, title: 'Optimize and convert', desc: 'Each image is compressed and converted to WebP (or JPEG/PNG) right in your browser.' },
  { icon: Download, title: 'Review and download', desc: 'Check real sizes and savings, compare before and after, then download files or a ZIP.' },
];

const BENEFITS = [
  { icon: Sparkles, title: 'Smaller image files', desc: 'Large photos often shrink dramatically when resized to sensible web dimensions and encoded as WebP. You always see the real result for each file.' },
  { icon: MousePointerClick, title: 'A simpler workflow', desc: 'No desktop software or command line. Drop images in, get web-ready files out, with presets for common needs.' },
  { icon: FileImage, title: 'Convenient WebP output', desc: 'WebP is supported by all modern browsers and is usually smaller than JPEG or PNG at similar quality.' },
  { icon: Eye, title: 'More control', desc: 'Set the floors the optimizer must respect — quality and minimum dimensions — and decide which images to process.' },
];

const FAQ = [
  { q: 'What does the optimizer do?', a: 'It reduces the file size of your images by resizing and re-encoding them, and converts them to WebP, JPEG or PNG. In Smart mode it works toward a target size you choose; in Basic mode it encodes once at a fixed quality.' },
  { q: 'How does smart selection work?', a: "When you add an image that is already smaller than your Smart-mode target, it isn't processed straight away. It's marked \"Needs review\" so you can optimize it anyway or keep the original. Smart mode then picks how to reach the target: it may scale large images down by a whole-number factor, then lowers quality in 5% steps and dimensions in 10% steps — never below the quality floor and minimum size you set." },
  { q: 'What is WebP?', a: 'WebP is an image format developed by Google that supports both lossy and lossless compression. It is supported by all current major browsers and usually produces smaller files than JPEG or PNG at comparable visual quality.' },
  { q: 'How do I optimize images?', a: 'Create a free account, open the Image Optimizer, and drop in your images. Choose a profile (Web, Balanced or High quality) or set your own target size, then download the results individually or as a ZIP.' },
  { q: 'Is the product free?', a: 'Yes. Optimizer.pro is free to use. There are no paid plans, and you never need to enter payment details.' },
  { q: 'What happens to uploaded images?', a: "Your images aren't uploaded. They are processed inside your browser and stay on your device. Results exist only in your browser tab until you download them; closing the tab discards them. For your history, your account stores only numbers — file sizes, formats and whether each optimization succeeded — never the images or file names." },
  { q: 'Do I need an account?', a: 'Yes. A free account gives you the optimizer workspace, your optimization history and saved default settings. Sign-up needs only a name, email and password.' },
  { q: 'What happens if optimization fails?', a: "The image is marked as failed with an explanation, and you can retry it — for example with a different output format. Other images in the batch aren't affected, and failed images are never counted as optimized in your statistics." },
];

const Section: React.FC<{ id: string; eyebrow: string; title: string; intro?: string; children: React.ReactNode; className?: string }> = ({ id, eyebrow, title, intro, children, className = '' }) => (
  <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 py-20 md:py-28 ${className}`}>
    <div className="max-w-page mx-auto px-4 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-800">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-ink">{title}</h2>
        {intro && <p className="mt-4 text-[17px] leading-relaxed text-muted">{intro}</p>}
      </div>
      <div className="mt-12">{children}</div>
    </div>
  </section>
);

export const SiteFooter: React.FC = () => (
  <footer className="border-t border-line bg-white">
    <div className="max-w-page mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
      <div>
        <Logo />
        <p className="mt-3 text-sm text-muted max-w-xs">A free image optimizer that compresses and converts images to WebP, right in your browser.</p>
      </div>
      <nav aria-label="Product">
        <p className="text-sm font-semibold text-ink">Product</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li><a href="/#features" className="text-muted hover:text-ink">Features</a></li>
          <li><a href="/#how-it-works" className="text-muted hover:text-ink">How It Works</a></li>
          <li><a href="/#faq" className="text-muted hover:text-ink">FAQ</a></li>
          <li><Link to="/signup" className="text-muted hover:text-ink">Get Started Free</Link></li>
        </ul>
      </nav>
      <nav aria-label="Legal and support">
        <p className="text-sm font-semibold text-ink">Company</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li><Link to="/privacy" className="text-muted hover:text-ink">Privacy Policy</Link></li>
          <li><Link to="/terms" className="text-muted hover:text-ink">Terms of Service</Link></li>
          {__SUPPORT_EMAIL__ && <li><a href={`mailto:${__SUPPORT_EMAIL__}`} className="text-muted hover:text-ink">Contact support</a></li>}
        </ul>
      </nav>
    </div>
    <div className="border-t border-line">
      <p className="max-w-page mx-auto px-4 sm:px-6 py-5 text-[13px] text-muted">© {new Date().getFullYear()} Optimizer.pro. All rights reserved.</p>
    </div>
  </footer>
);

export const LandingPage: React.FC = () => {
  const { status } = useAuth();
  const { search } = useLocation();
  const signedIn = status === 'authenticated';
  const startTo = signedIn ? '/app/optimize' : '/signup';
  const accountDeleted = new URLSearchParams(search).get('account') === 'deleted';

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-raised">Skip to content</a>
      <LandingNav />
      <main id="main">
        {accountDeleted && (
          <div className="max-w-page mx-auto px-4 sm:px-6 pt-6"><Alert tone="success">Your account and its data have been deleted.</Alert></div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-brand-100/60 blur-3xl" />
          </div>
          <div className="relative max-w-page mx-auto px-4 sm:px-6 pt-14 md:pt-24 pb-16 md:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div className="animate-op-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-[13px] font-medium text-brand-800">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" aria-hidden="true" /> Free · Runs in your browser
              </p>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-ink leading-[1.05]">
                Make Your Images Smaller.<br /><span className="text-brand-700">Keep Your Quality.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted max-w-xl">
                Optimize large images with smart selection and convert them to lightweight WebP files. Reduce image size, simplify your workflow, and prepare your images for a faster web.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <LinkButton to={startTo} size="lg">Start Optimizing Free <ArrowRight size={18} aria-hidden="true" /></LinkButton>
                <a href="#features" className={buttonClass('secondary', 'lg')}>Explore Features</a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {['No credit card', 'Images never uploaded', 'WebP, JPEG & PNG output'].map(t => (
                  <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-700" aria-hidden="true" />{t}</li>
                ))}
              </ul>
            </div>
            <ProductPreview />
          </div>
        </section>

        <Section id="features" eyebrow="Features" title="Everything you need to ship lighter images" intro="Built around a compression engine that measures every result — so you get the size you asked for, or the smallest file your quality limits allow." className="bg-white border-y border-line">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <article key={f.title} className="rounded-xl border border-line bg-canvas/50 p-6 hover:border-brand-300 hover:bg-white hover:shadow-raised transition">
                <span className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center" aria-hidden="true"><f.icon size={19} /></span>
                <h3 className="mt-5 text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="how-it-works" eyebrow="How It Works" title="From heavy to web-ready in five steps">
          <ol className="grid md:grid-cols-5 gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-xl bg-white border border-line p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-lg bg-brand-500 text-on-brand flex items-center justify-center" aria-hidden="true"><s.icon size={19} /></span>
                  <span className="text-sm font-semibold text-subtle tabular-nums" aria-hidden="true">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink"><span className="sr-only">Step {i + 1}: </span>{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="benefits" eyebrow="Benefits" title="Lighter pages without the busywork" className="bg-white border-y border-line">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="grid sm:grid-cols-2 gap-5">
              {BENEFITS.map(b => (
                <div key={b.title} className="p-1">
                  <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center" aria-hidden="true"><b.icon size={19} /></span>
                  <h3 className="mt-4 text-base font-semibold text-ink">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{b.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-ink text-white p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-brand-500/15" aria-hidden="true" />
              <p className="relative text-sm font-semibold text-brand-400">Your dashboard</p>
              <p className="relative mt-3 text-2xl font-bold tracking-tight">Track what you've saved</p>
              <p className="relative mt-3 text-white/75 leading-relaxed">Your account keeps a history of every batch — images optimized, original and optimized size, and the real bytes saved. Only numbers are stored, never your images.</p>
              <ul className="relative mt-6 space-y-2.5 text-sm text-white/85">
                {['Totals across all your batches', 'Failed files are never counted as savings', 'Clear your history or delete your account any time'].map(t => (
                  <li key={t} className="flex items-start gap-2"><CheckCircle2 size={16} className="text-brand-400 mt-0.5 shrink-0" aria-hidden="true" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="faq" eyebrow="FAQ" title="Frequently asked questions">
          <div className="max-w-3xl divide-y divide-line border-y border-line">
            {FAQ.map(item => (
              <details key={item.q} className="group py-1">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer rounded-md text-left text-[16px] font-semibold text-ink">
                  {item.q}
                  <ChevronDown size={18} className="text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-5 pr-8 text-[15px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* Final CTA */}
        <section className="pb-24 px-4 sm:px-6">
          <div className="max-w-page mx-auto rounded-3xl bg-brand-500 px-6 py-14 md:py-20 text-center relative overflow-hidden">
            <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-white/15" aria-hidden="true" />
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-brand-400/60" aria-hidden="true" />
            <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight text-on-brand">Ready to optimize your images?</h2>
            <p className="relative mt-4 text-[17px] text-on-brand/80 max-w-xl mx-auto">Create a free account and start shrinking images in under a minute.</p>
            <div className="relative mt-8 flex justify-center">
              <LinkButton to={startTo} size="lg" variant="dark">Get Started Free <ArrowRight size={18} aria-hidden="true" /></LinkButton>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
