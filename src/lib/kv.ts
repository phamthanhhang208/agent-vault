import { kv } from '@vercel/kv';

// Re-export the kv client for use across the app
export { kv };

// Typed helpers for common operations

export async function getJson<T>(key: string): Promise<T | null> {
  const value = await kv.get<T>(key);
  return value ?? null;
}

export async function setJson<T>(key: string, value: T, expirationSeconds?: number): Promise<void> {
  if (expirationSeconds) {
    await kv.set(key, value, { ex: expirationSeconds });
  } else {
    await kv.set(key, value);
  }
}

export async function deleteKey(key: string): Promise<void> {
  await kv.del(key);
}

// Scan keys by prefix pattern
export async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [nextCursor, batch] = await kv.scan(cursor, { match: pattern, count: 100 });
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== 0);
  return keys;
}

// Get multiple JSON values by key prefix
export async function getByPrefix<T>(prefix: string): Promise<T[]> {
  const keys = await scanKeys(`${prefix}*`);
  if (keys.length === 0) return [];
  const values = await Promise.all(keys.map((key) => kv.get<T>(key)));
  return values.filter((v): v is T => v !== null);
}
