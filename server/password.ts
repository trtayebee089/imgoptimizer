import crypto from 'crypto';

// scrypt parameters (N=2^15 keeps hashing around ~50-100ms on typical servers)
const N = 32768;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEM = 64 * 1024 * 1024;

const scrypt = (password: string, salt: Buffer, n: number, r: number, p: number, keylen: number) =>
  new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N: n, r, p, maxmem: MAX_MEM }, (err, key) => (err ? reject(err) : resolve(key)));
  });

/** Returns a self-describing hash: scrypt$N$r$p$salt$hash (base64 parts). */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, N, R, P, KEY_LENGTH);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const key = await scrypt(password, Buffer.from(saltB64, 'base64'), Number(n), Number(r), Number(p), expected.length);
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
};

/** Random URL-safe token for sessions and password resets. Only its SHA-256 is stored. */
export const generateToken = () => crypto.randomBytes(32).toString('base64url');
export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
