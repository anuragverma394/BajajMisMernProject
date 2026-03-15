const { getRedisClient } = require('../config/redis');

const DEFAULT_TTL_SECONDS = 300;
const KEY_PREFIX = 'cache:';

function normalizeKey(key) {
  const raw = String(key || '').trim();
  return raw.startsWith(KEY_PREFIX) ? raw : `${KEY_PREFIX}${raw}`;
}

function buildKey(...parts) {
  return parts
    .map((p) => {
      if (p === null || p === undefined) return '';
      if (typeof p === 'string' || typeof p === 'number' || typeof p === 'boolean') return String(p);
      try {
        return JSON.stringify(p);
      } catch (_) {
        return String(p);
      }
    })
    .filter(Boolean)
    .join('|');
}

async function get(key) {
  const client = await getRedisClient();
  if (!client) return undefined;

  try {
    const raw = await client.get(normalizeKey(key));
    if (raw === null) return undefined;
    return JSON.parse(raw);
  } catch (_) {
    return undefined;
  }
}

async function set(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const client = await getRedisClient();
  if (!client) return false;

  const ttlNum = Number(ttlSeconds);
  const ttl = Number.isFinite(ttlNum) && ttlNum > 0 ? Math.floor(ttlNum) : DEFAULT_TTL_SECONDS;

  try {
    const payload = JSON.stringify(value);
    await client.set(normalizeKey(key), payload, { EX: ttl });
    return true;
  } catch (_) {
    return false;
  }
}

async function getOrSet(key, fetchFn, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const cached = await get(key);
  if (cached !== undefined) {
    return { hit: true, value: cached };
  }

  const value = await fetchFn();
  // best-effort write; never fail the request
  void set(key, value, ttlSeconds);
  return { hit: false, value };
}

module.exports = {
  DEFAULT_TTL_SECONDS,
  buildKey,
  get,
  set,
  getOrSet
};

