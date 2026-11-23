// config/cache.js
// A tiny wrapper around Redis (local Redis or Upstash) that makes caching OPTIONAL and SAFE.
//
// Why a wrapper?
// - If REDIS_URL is not set, the app runs fine without any cache.
// - If Redis is down, slow, or the connection silently died (laptop slept,
//   Upstash closed an idle connection, ...), requests do NOT hang or fail.
//   We just skip the cache and use MongoDB.
//
// Controllers only use these 4 functions:
//   getCache(key)                 -> cached value or null
//   setCache(key, value, seconds) -> save a value for some seconds
//   deleteCache(...keys)          -> remove exact keys
//   deleteCacheByPattern(pattern) -> remove keys like "leaderboard:123:*"

import { createClient } from 'redis';

// If Redis does not answer within this time, we give up and use MongoDB instead
const TIMEOUT_MS = 1500;

// Print Redis problems at most once per minute so the terminal is not flooded
let lastWarning = 0;
function warn(message) {
  if (Date.now() - lastWarning > 60 * 1000) {
    console.warn(`Redis problem (app keeps working without cache): ${message}`);
    lastWarning = Date.now();
  }
}

let client = null;

if (process.env.REDIS_URL) {
  client = createClient({
    url: process.env.REDIS_URL, // Upstash URLs start with rediss:// (secure connection)
    // If Redis is not connected, fail immediately instead of waiting
    disableOfflineQueue: true,
    // Send a PING every 4 minutes so idle connections are kept alive / noticed
    pingInterval: 4 * 60 * 1000,
    socket: {
      connectTimeout: 5000,
      // Try to reconnect: wait 0.5s, 1s, 1.5s ... up to 10s between tries
      reconnectStrategy: (retries) => Math.min(retries * 500, 10000),
    },
  });

  client.on('error', (err) => warn(err.message));
  client.on('ready', () => console.log('Redis connected'));

  client.connect().catch(() => {
    // Errors are already printed by the 'error' listener above
  });
} else {
  console.log('REDIS_URL not set: running without cache');
}

// When Redis stops answering, we skip it for 30 seconds (so pages stay fast)
let skipUntil = 0;

const isReady = () => Boolean(client && client.isReady && Date.now() > skipUntil);

// The connection looks dead: throw it away and open a fresh one in the background
function resetConnection() {
  skipUntil = Date.now() + 30 * 1000;
  client.destroy();
  client.connect().catch(() => {});
}

// Runs a Redis command, but stops waiting after TIMEOUT_MS
function withTimeout(promise) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (isReady()) resetConnection();
      reject(new Error(`no answer within ${TIMEOUT_MS}ms, reconnecting`));
    }, TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function getCache(key) {
  if (!isReady()) return null;
  try {
    const value = await withTimeout(client.get(key));
    return value ? JSON.parse(value) : null;
  } catch (err) {
    warn(err.message);
    return null;
  }
}

export async function setCache(key, value, seconds) {
  if (!isReady()) return;
  try {
    await withTimeout(client.set(key, JSON.stringify(value), { EX: seconds }));
  } catch (err) {
    warn(err.message); // the data is still returned from MongoDB
  }
}

export async function deleteCache(...keys) {
  if (!isReady() || keys.length === 0) return;
  try {
    await withTimeout(client.del(keys));
  } catch (err) {
    warn(err.message);
  }
}

export async function deleteCacheByPattern(pattern) {
  if (!isReady()) return;
  try {
    const keys = await withTimeout(client.keys(pattern));
    if (keys.length > 0) await withTimeout(client.del(keys));
  } catch (err) {
    warn(err.message);
  }
}
