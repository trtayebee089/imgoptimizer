// Validation rules shared by the auth API and the auth forms.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 80;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: unknown) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Enter your email address.';
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
};

export const validatePassword = (password: unknown): string | null => {
  if (typeof password !== 'string' || password.length === 0) return 'Enter a password.';
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  return null;
};

export const validateName = (name: unknown): string | null => {
  if (typeof name !== 'string' || !name.trim()) return 'Enter your name.';
  if (name.trim().length > NAME_MAX) return `Use at most ${NAME_MAX} characters.`;
  return null;
};
