import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SALT_LEN = 16;
const KEY_LEN = 64;
const PREFIX = 'scrypt:';

export const hashPassword = (password: string): string => {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(password, salt, KEY_LEN);
  return `${PREFIX}${salt.toString('base64')}:${hash.toString('base64')}`;
};

export const verifyPassword = (password: string, stored: string): boolean => {
  if (!stored.startsWith(PREFIX)) {
    return stored === password;
  }
  const body = stored.slice(PREFIX.length);
  const sep = body.indexOf(':');
  if (sep < 0) {
    return false;
  }
  const salt = Buffer.from(body.slice(0, sep), 'base64');
  const expected = Buffer.from(body.slice(sep + 1), 'base64');
  const actual = scryptSync(password, salt, KEY_LEN);
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
};

export const isPasswordHashed = (stored: string): boolean =>
  stored.startsWith(PREFIX);