// Validation rules shared by the auth API and the auth forms.

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 80;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A short list of the most common leaked passwords that still pass the length rule.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwertyuiop', 'qwerty123',
  '11111111', '00000000', 'iloveyou', 'sunshine', 'princess', 'football', 'baseball', 'welcome1', 'admin123',
  'letmein1', 'abc12345', 'passw0rd', 'trustno1', '1q2w3e4r', 'qwerty12', 'asdfghjk', 'zaq12wsx', 'abcd1234',
]);

export const normalizeEmail = (email: unknown) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Enter your email address.';
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
};

export const validatePassword = (password: unknown, email?: string): string | null => {
  if (typeof password !== 'string' || password.length === 0) return 'Enter a password.';
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || /^(.)\1+$/.test(password)) return 'This password is too common. Choose something harder to guess.';
  if (email && lower === normalizeEmail(email)) return "Don't use your email address as your password.";
  return null;
};

/** Rough 0–4 strength score for the password meter (the server only enforces validatePassword). */
export const passwordStrength = (password: string): { score: 0 | 1 | 2 | 3 | 4; label: string } => {
  if (!password) return { score: 0, label: '' };
  if (validatePassword(password)) return { score: 1, label: 'Too weak' };
  let variety = 0;
  if (/[a-z]/.test(password)) variety++;
  if (/[A-Z]/.test(password)) variety++;
  if (/\d/.test(password)) variety++;
  if (/[^A-Za-z0-9]/.test(password)) variety++;
  const long = password.length >= 14;
  if (long && variety >= 3) return { score: 4, label: 'Strong' };
  if (long || variety >= 3) return { score: 3, label: 'Good' };
  return { score: 2, label: 'Fair' };
};

export const validateName = (name: unknown): string | null => {
  if (typeof name !== 'string' || !name.trim()) return 'Enter your name.';
  if (name.trim().length > NAME_MAX) return `Use at most ${NAME_MAX} characters.`;
  return null;
};
