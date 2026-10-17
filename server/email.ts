// Transactional email. Delivery uses the Resend HTTP API (no SDK dependency):
//   RESEND_API_KEY  — API key from https://resend.com
//   EMAIL_FROM      — verified sender, e.g. "Optimizer.pro <no-reply@hivelabsbd.com>"
// Without both, email is not configured and callers must say so honestly.

export type EmailDelivery = 'email' | 'server-log' | 'unavailable';

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/** How password-reset links reach the user on this deployment. */
export const resetDeliveryMode = (): EmailDelivery => {
  if (isEmailConfigured()) return 'email';
  // Development fallback: print links to the server console (never in production unless explicitly enabled).
  if (process.env.NODE_ENV !== 'production' || process.env.AUTH_LOG_RESET_LINKS === 'true') return 'server-log';
  return 'unavailable';
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export interface OutgoingEmail { to: string; subject: string; text: string; html: string }

export const sendEmail = async (msg: OutgoingEmail): Promise<void> => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    // Body may describe the problem (e.g. unverified domain); it never contains the reset token.
    const detail = await res.text().catch(() => '');
    throw new Error(`Email provider responded ${res.status}: ${detail.slice(0, 300)}`);
  }
};

export const passwordResetEmail = (to: string, name: string, link: string, ttlMinutes: number): OutgoingEmail => ({
  to,
  subject: 'Reset your Optimizer.pro password',
  text: `Hi ${name},\n\nSomeone (hopefully you) asked to reset the password for your Optimizer.pro account.\n\nChoose a new password: ${link}\n\nThis link expires in ${ttlMinutes} minutes and can be used once. If you didn't ask for this, you can ignore this email — your password won't change.\n`,
  html: `<div style="font-family:Inter,Arial,sans-serif;color:#202720;max-width:480px;margin:0 auto;padding:24px">
  <p style="font-size:18px;font-weight:700;margin:0 0 16px">Optimizer<span style="color:#218838">.pro</span></p>
  <p>Hi ${escapeHtml(name)},</p>
  <p>Someone (hopefully you) asked to reset the password for your Optimizer.pro account.</p>
  <p style="margin:24px 0"><a href="${escapeHtml(link)}" style="background:#61CE70;color:#102414;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;display:inline-block">Choose a new password</a></p>
  <p style="color:#667066;font-size:14px">This link expires in ${ttlMinutes} minutes and can be used once. If you didn't ask for this, ignore this email — your password won't change.</p>
</div>`,
});
