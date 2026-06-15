// import { createClient } from 'redis';
// import dotenv from 'dotenv';

// dotenv.config();

// const client = createClient({
//   url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
// });

// client.on('error', (err) => console.error('Redis Client Error', err));
// client.on('connect', () => console.log('✅ Redis connected successfully'));

// await client.connect();

// export default client;



import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  socket: {
    // Reconnect with exponential backoff — never give up
    reconnectStrategy: (retries) => {
      // Wait at most 3 seconds between retries
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis reconnecting in ${delay}ms (attempt ${retries})...`);
      return delay;
    },
    // Connection timeout (ms) — don't hang forever
    connectTimeout: 10000,
  },
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('✅ Redis connected successfully'));
client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
client.on('ready', () => console.log('✅ Redis ready'));

// Connect once — errors are handled by the event listener above,
// so we don't crash the process if Redis isn't ready immediately.
client.connect().catch((err) => {
  console.error('Redis initial connect failed, will retry automatically:', err.message);
});

export default client;