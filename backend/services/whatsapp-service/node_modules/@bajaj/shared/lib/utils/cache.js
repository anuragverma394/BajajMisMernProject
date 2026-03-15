/**
 * Unified Cache Service using Redis
 * Provides distributed caching for microservices
 */

const redis = require('redis');
const { getLogger } = require('./logger');

let redisClient = null;
const logger = getLogger('cache-service');

/**
 * Initialize Redis connection
 */
async function initializeCache(options = {}) {
  try {
    const config = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      retryStrategy: options.retryStrategy || ((times) => Math.min(times * 50, 2000)),
      enableReadyCheck: options.enableReadyCheck !== false,
      enableOfflineQueue: options.enableOfflineQueue !== false
    };

    redisClient = redis.createClient(config);

    redisClient.on('connect', () => {
      logger.info('Redis connected', config);
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', err, { host: config.host, port: config.port });
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    return redisClient;
  } catch (err) {
    logger.error('Failed to initialize Redis', err);
    throw err;
  }
}

/**
 * Get value from cache
 */
async function get(key) {
  if (!redisClient) {
    return null;
  }

  try {
    const value = await new Promise((resolve, reject) => {
      redisClient.get(key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (err) {
    logger.warn('Cache get error', err, { key });
    return null;
  }
}

/**
 * Set value in cache
 */
async function set(key, value, ttlSeconds = 3600) {
  if (!redisClient) {
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    await new Promise((resolve, reject) => {
      if (ttlSeconds) {
        redisClient.setex(key, ttlSeconds, serialized, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      } else {
        redisClient.set(key, serialized, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      }
    });

    return true;
  } catch (err) {
    logger.warn('Cache set error', err, { key, ttl: ttlSeconds });
    return false;
  }
}

/**
 * Delete value from cache
 */
async function del(key) {
  if (!redisClient) {
    return false;
  }

  try {
    const result = await new Promise((resolve, reject) => {
      redisClient.del(key, (err, count) => {
        if (err) reject(err);
        else resolve(count);
      });
    });

    return result > 0;
  } catch (err) {
    logger.warn('Cache del error', err, { key });
    return false;
  }
}

/**
 * Clear all cache (use carefully!)
 */
async function flush() {
  if (!redisClient) {
    return false;
  }

  try {
    await new Promise((resolve, reject) => {
      redisClient.flushdb((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    logger.info('Cache flushed');
    return true;
  } catch (err) {
    logger.error('Cache flush error', err);
    return false;
  }
}

/**
 * Get or set pattern - returns from cache or executes callback
 */
async function getOrSet(key, callback, ttlSeconds = 3600) {
  if (!redisClient) {
    return callback();
  }

  try {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    // Cache miss - execute callback
    logger.debug('Cache miss', { key });
    const result = await callback();

    // Store in cache
    if (result !== null && result !== undefined) {
      await set(key, result, ttlSeconds);
    }

    return result;
  } catch (err) {
    logger.error('Cache getOrSet error', err, { key });
    // On error, still execute callback
    return callback();
  }
}

/**
 * Close cache connection
 */
function close() {
  if (redisClient) {
    redisClient.quit();
    redisClient = null;
    logger.info('Cache connection closed');
  }
}

module.exports = {
  initializeCache,
  get,
  set,
  del,
  flush,
  getOrSet,
  close,
  isConnected: () => !!redisClient
};
