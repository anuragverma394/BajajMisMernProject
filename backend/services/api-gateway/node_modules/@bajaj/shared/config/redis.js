let redisPkg = null;
try {
  // Optional dependency at runtime; caching is disabled if not installed.
  // eslint-disable-next-line global-require
  redisPkg = require('redis');
} catch (_) {
  redisPkg = null;
}

function getRedisUrl() {
  return process.env.REDIS_URL;
}

let client = null;
let connectPromise = null;
let disabled = false;
let lastLogAtMs = 0;

function shouldLog() {
  const now = Date.now();
  if (now - lastLogAtMs > 60000) {
    lastLogAtMs = now;
    return true;
  }
  return false;
}

async function getRedisClient() {
  if (disabled) return null;
  const REDIS_URL = getRedisUrl();
  if (!REDIS_URL) return null;
  if (!redisPkg?.createClient) return null;

  if (!client) {
    client = redisPkg.createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 500,
        reconnectStrategy: () => new Error('Redis disabled')
      }
    });
    client.on('error', (err) => {
      if (shouldLog()) {
        // eslint-disable-next-line no-console
        console.warn('[redis] client error:', err?.message || err);
      }
    });
  }

  if (client.isOpen) return client;

  if (!connectPromise) {
    connectPromise = client.connect().catch(async (err) => {
      disabled = true;
      if (shouldLog()) {
        // eslint-disable-next-line no-console
        console.warn('[redis] disabled (connect failed):', err?.message || err);
      }
      try {
        await client?.quit();
      } catch (_) {
        // ignore
      }
      client = null;
      connectPromise = null;
      return null;
    });
  }

  await connectPromise;
  return client && client.isOpen ? client : null;
}

async function quitRedis() {
  try {
    if (client?.isOpen) {
      await client.quit();
    }
  } catch (_) {
    // ignore
  } finally {
    client = null;
    connectPromise = null;
    disabled = false;
  }
}

module.exports = {
  getRedisClient,
  quitRedis
};
