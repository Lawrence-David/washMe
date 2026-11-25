import { randomBytes, scrypt, timingSafeEqual, createHash } from 'crypto';

// Password hashing with Node's built-in scrypt (no native modules to install).
// Stored format: scrypt$<N>$<salt base64>$<hash base64>
const KEYLEN = 64;
const COST = 16384;

function derive(password: string, salt: Buffer, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N: cost, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, COST);
  return `scrypt$${COST}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, cost, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !cost || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(cost));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the username doesn't exist, so a failed login takes about as long either way
// (stops attackers from discovering which usernames exist by timing the response).
let dummyHash: Promise<string> | undefined;
export async function fakeVerify(password: string) {
  dummyHash ??= hashPassword(randomBytes(12).toString('hex'));
  await verifyPassword(password, await dummyHash);
  return false;
}

export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
