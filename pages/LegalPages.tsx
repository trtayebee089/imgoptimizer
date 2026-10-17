import React from 'react';
import { Logo, LinkButton } from '../components/ui';
import { SiteFooter } from './LandingPage';
import { useAuth } from '../lib/auth';

// Plain-language policies that describe what this codebase actually does.
// Review with a legal professional before relying on them commercially.

const LAST_UPDATED = 'October 17, 2026';

const LegalLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { status } = useAuth();
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur border-b border-line">
        <div className="max-w-page mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <Logo />
          {status === 'authenticated'
            ? <LinkButton to="/app" size="sm">Open Dashboard</LinkButton>
            : <LinkButton to="/signup" size="sm">Get Started Free</LinkButton>}
        </div>
      </header>
      <main id="main" className="flex-1 px-4 sm:px-6 py-12 md:py-16">
        <article className="max-w-3xl mx-auto bg-white border border-line rounded-2xl shadow-card px-6 py-8 md:px-12 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">Last updated {LAST_UPDATED}</p>
          <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-10 [&_h2]:mb-3 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brand-800 [&_a]:font-semibold [&_a]:underline">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};

const Contact: React.FC = () => (
  __SUPPORT_EMAIL__
    ? <p>Questions about this policy? Email <a href={`mailto:${__SUPPORT_EMAIL__}`}>{__SUPPORT_EMAIL__}</a>.</p>
    : <p>You can manage or delete your data at any time from <strong>Settings</strong> in your dashboard.</p>
);

export const PrivacyPage: React.FC = () => (
  <LegalLayout title="Privacy Policy">
    <p>This policy explains what information Optimizer.pro ("the service") handles, why, and the choices you have. We have written it to match how the service actually works.</p>

    <h2>Your images</h2>
    <p>Images you add to the optimizer are <strong>processed entirely in your web browser</strong> using your device's built-in image tools. Image files are <strong>not uploaded</strong> to our servers and we never see their contents or file names. Optimized results exist only in your browser tab until you download them; closing or reloading the tab discards them.</p>

    <h2>Information we store</h2>
    <ul>
      <li><strong>Account details:</strong> your name, email address, the date you accepted these terms, and your password — stored only as a salted scrypt hash, never in readable form.</li>
      <li><strong>Optimizer preferences:</strong> default optimization settings, if you choose to save them.</li>
      <li><strong>Optimization history:</strong> for each image you process — original size and optimized size in bytes, input and output format, mode (Smart or Basic), whether it succeeded, and when. No image content or file names.</li>
      <li><strong>Sessions:</strong> a random sign-in token (stored as a hash) and its expiry, so you stay signed in.</li>
      <li><strong>Password resets:</strong> a hashed single-use token that expires after one hour.</li>
      <li><strong>Abuse prevention:</strong> short-lived counters keyed by a hash of your IP address (and, for sign-in and password reset, the email entered) to limit repeated attempts. They expire automatically within an hour.</li>
    </ul>

    <h2>How we use it</h2>
    <p>We use this information only to provide the service: to sign you in, show your history and statistics, save your preferences, send password-reset emails you request, and protect the service from abuse. We don't sell your information or use it for advertising.</p>

    <h2>Cookies</h2>
    <p>We set a single essential cookie that keeps you signed in. It is HttpOnly (not readable by scripts), limited to this site, and expires after one day — or 30 days if you choose "Keep me signed in". We don't use analytics or advertising cookies.</p>

    <h2>Service providers</h2>
    <ul>
      <li><strong>Hosting:</strong> the site and its API run on a cloud hosting provider, which processes standard request data such as IP addresses in its logs.</li>
      <li><strong>Database:</strong> account and history data is stored in a managed MongoDB database.</li>
      <li><strong>Email:</strong> password-reset emails are sent through a transactional email provider, which receives your email address and the message.</li>
      <li><strong>Fonts:</strong> the Inter typeface is loaded from Google Fonts, which receives your IP address when the page loads.</li>
    </ul>

    <h2>Retention and deletion</h2>
    <p>We keep your account and history until you delete them. In <strong>Settings</strong> you can clear your optimization history, sign out of all devices, or permanently delete your account — which removes your account, sessions, reset tokens and history immediately. Copies in routine infrastructure backups, if any, expire according to the provider's schedule.</p>

    <h2>Security</h2>
    <p>Passwords are hashed with scrypt, session tokens are stored only as hashes, connections use HTTPS in production, and sign-in, sign-up and password-reset requests are rate limited. No system is perfectly secure, so please use a unique password.</p>

    <h2>Changes</h2>
    <p>If we change how the service handles information, we will update this page and its date.</p>
    <Contact />
  </LegalLayout>
);

export const TermsPage: React.FC = () => (
  <LegalLayout title="Terms of Service">
    <p>These terms apply to your use of Optimizer.pro ("the service"). By creating an account or using the service, you agree to them.</p>

    <h2>The service</h2>
    <p>Optimizer.pro lets you compress, resize and convert images in your web browser and keeps a history of the file sizes involved. The service is currently <strong>free of charge</strong>. Features may change, and we may add, modify or discontinue parts of the service.</p>

    <h2>Your account</h2>
    <ul>
      <li>Provide accurate information and keep your password confidential.</li>
      <li>You are responsible for activity under your account. Tell us promptly if you believe it has been compromised, and change your password.</li>
      <li>You can delete your account at any time from Settings.</li>
    </ul>

    <h2>Your content</h2>
    <p>Images are processed on your own device and are not uploaded to us, so you keep full control and ownership of them. You are responsible for having the rights to the images you process.</p>

    <h2>Acceptable use</h2>
    <ul>
      <li>Don't attempt to disrupt, overload, probe or gain unauthorized access to the service or its infrastructure.</li>
      <li>Don't use automated means to create accounts or to circumvent rate limits.</li>
      <li>Don't use the service in violation of applicable law.</li>
    </ul>
    <p>We may suspend or close accounts that break these rules.</p>

    <h2>No warranty</h2>
    <p>The service is provided "as is" and "as available". Compression results depend on your images, settings and browser; a target file size is a goal, not a guarantee, and an optimized file can occasionally be larger than the original. Keep your original images.</p>

    <h2>Limitation of liability</h2>
    <p>To the extent permitted by law, the operator of the service is not liable for indirect or consequential losses, or for loss of data or images, arising from your use of the service.</p>

    <h2>Changes to these terms</h2>
    <p>We may update these terms. If changes are significant we will update the date above; continuing to use the service after that means you accept the updated terms.</p>
    <Contact />
  </LegalLayout>
);
