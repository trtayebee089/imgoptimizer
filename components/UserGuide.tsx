
import React from 'react';
import { Upload, SlidersHorizontal, Repeat, Ruler, Layers, Download, ShieldCheck, Lightbulb } from 'lucide-react';

const SECTIONS = [
  { id: 'adding-images', label: 'Adding images', icon: Upload },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
  { id: 'smart-mode', label: 'How Smart mode works', icon: Repeat },
  { id: 'dimensions', label: 'Dimensions', icon: Ruler },
  { id: 'results', label: 'Results & downloads', icon: Download },
  { id: 'batch', label: 'Batch actions', icon: Layers },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
];

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 bg-white border border-line rounded-xl p-5 md:p-6 shadow-card">
    <h2 className="text-lg font-bold tracking-tight text-ink mb-3">{title}</h2>
    <div className="text-[15px] leading-relaxed text-muted space-y-3 [&_strong]:text-ink [&_strong]:font-semibold">{children}</div>
  </section>
);

export const UserGuide: React.FC = () => {
  const scrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-ink">Guide</h1>
        <p className="text-sm text-muted mt-1.5 max-w-2xl">Everything you need to get small, sharp images out of Optimizer.pro.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <nav aria-label="Guide sections" className="lg:w-56 shrink-0">
          <ul className="lg:sticky lg:top-6 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
            {SECTIONS.map(s => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} onClick={(e) => scrollTo(e, s.id)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-ink hover:bg-white whitespace-nowrap">
                  <s.icon size={16} aria-hidden="true" />{s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 space-y-4">
          <Section id="adding-images" title="Adding images">
            <p>There are three ways to add images to the workspace:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Drag and drop</strong> files anywhere on the workspace page.</li>
              <li><strong>Paste</strong> an image from your clipboard with Ctrl + V (⌘ + V on Mac).</li>
              <li><strong>Browse</strong> with the Choose files button. You can select many files at once.</li>
            </ul>
            <p>Any image your browser can open is accepted (for example JPG, PNG, WebP, GIF or AVIF). Results are written as <strong>WebP, JPEG or PNG</strong>. Images are processed one at a time, in the order they were added, using the settings active when each one starts.</p>
          </Section>

          <Section id="settings" title="Settings">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Compression mode.</strong> <em>Smart</em> works toward a target file size. <em>Basic</em> encodes once at 90% quality and keeps the original dimensions.</li>
              <li><strong>Output format.</strong> WebP (default), JPEG or PNG. PNG is lossless, so only dimensions can be reduced.</li>
              <li><strong>Profiles.</strong> Shortcuts for common combinations — Web (50 KB · 60% · 600 px), Balanced (100 KB · 75% · 750 px) and High quality (500 KB · 90% · 1200 px).</li>
              <li><strong>Target size.</strong> The file size Smart mode aims for (10–1000 KB).</li>
              <li><strong>Quality floor.</strong> The lowest encoding quality Smart mode will use.</li>
              <li><strong>Dimensions.</strong> The smallest size an image may be scaled down to (see below).</li>
            </ul>
          </Section>

          <Section id="smart-mode" title="How Smart mode works">
            <p>Smart mode compresses, measures the result, and adjusts — repeating until the file fits your target or a limit is reached.</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>If the image is <strong>already under the target size and in the chosen format</strong>, the original is kept.</li>
              <li>If the image is much larger than the minimum dimensions, it is first <strong>scaled down by a whole-number factor</strong> (for example 1/2 or 1/3) while staying above the minimum, then checked at 99% quality.</li>
              <li>Otherwise it is encoded at full resolution and quality.</li>
              <li>While the file is too large, quality is lowered in <strong>5% steps down to 80%</strong> (or your floor, if higher), then dimensions are reduced in <strong>10% steps</strong> down to the minimum, then quality continues down to the floor.</li>
              <li>The loop stops when the target is met, or after 25 passes, or when neither quality nor size can be reduced further.</li>
            </ol>
            <p>The target size is a goal, not a guarantee. If your quality floor and minimum dimensions don't allow the file to get that small, you get the smallest result within those limits. Every step is listed in the result's <strong>steps</strong> table.</p>
            <p>When you add a file that's already smaller than the target in Smart mode, it's marked <strong>Needs review</strong>. Choose <em>Optimize</em> to process it anyway, or <em>Skip</em> to keep the original.</p>
          </Section>

          <Section id="dimensions" title="Dimensions">
            <p><strong>Min edge</strong> keeps the shorter side of the image at or above the value you set. A 3000×2000 photo with a 750 px minimum edge will never be scaled below 1125×750.</p>
            <p><strong>Width × height</strong> lets you set separate minimums in pixels. If both are 0, images may be reduced to as little as 50 px wide.</p>
            <p>Images are never enlarged.</p>
          </Section>

          <Section id="results" title="Results & downloads">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Each result shows the input and output format, the original and optimized file size, the percentage saved, and the dimensions.</li>
              <li><strong>Compare</strong> (or click the thumbnail) opens a before/after slider.</li>
              <li><strong>Download</strong> saves a single file; <strong>Copy</strong> places the result on your clipboard.</li>
              <li>Click a file name to <strong>rename</strong> it before downloading.</li>
              <li><strong>Reprocess</strong> runs the image again with your current settings.</li>
            </ul>
          </Section>

          <Section id="batch" title="Batch actions">
            <p>Once images are in the queue, the toolbar above the list lets you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Download ZIP</strong> — every completed image in one archive.</li>
              <li><strong>Download files</strong> — every completed image as a separate download.</li>
              <li><strong>Rename all</strong> — give every file a common base name with a number (photo_1, photo_2…).</li>
              <li><strong>Reprocess all</strong> — run the whole queue again with the current settings.</li>
              <li><strong>Clear</strong> — remove everything from the queue.</li>
            </ul>
          </Section>

          <Section id="privacy" title="Privacy">
            <p>Images are decoded, resized and encoded <strong>inside your browser</strong> using the Canvas API. Image files are not uploaded to the Optimizer.pro server.</p>
            <p>After each image is processed, the app records anonymous totals — one more file processed, its original size, and the bytes saved — which power the Statistics page. Your account stores your name, email and a securely hashed password.</p>
          </Section>

          <Section id="tips" title="Tips">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Keep the quality floor at <strong>70% or higher</strong> for photos. Very low floors produce visible blockiness.</li>
              <li>For screenshots and graphics with text, prefer a higher minimum edge so text stays readable.</li>
              <li>WebP usually gives the smallest files at a given quality. Use JPEG when you need maximum compatibility.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
};
