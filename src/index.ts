// import express from 'express';
// import { Request, Response } from 'express';
import RateLimitThrottle from './middleware/RateLimitThrottle';
// import { RedisClientType, createClient } from 'redis';
// import Redis from 'ioredis';

// const redisClient = new Redis({
//   host: 'redis-9b8897-abnovel-95a8.b.aivencloud.com',
//   port: 19013,
//   username: 'default',
//   password: 'AVNS_WLD6rvRCWcXW7VL7xGx',
// });

// const rateLimitThrottle = new RateLimitThrottle({
//   rateLimitWindowMs: 10000, // 15 minutes
//   maxRequestsPerWindow: 1, // Max 100 requests per window
//   throttleBurst: 4, // Initial burst of  requests allowed immediately
//   throttleRate: 1, // Request's allowed per second after the burst
//   redisClient,
//   customMessage: 'Too Many Requests',
// });

// const app = express();
// const PORT = process.env.PORT || 8000;

// app.use(rateLimitThrottle.middleware());
// app.get('/api/data', (req: Request, res: Response) => {
//   res.send('Data fetched');
// });

// app.listen(PORT, () => {
//   console.log(`Server listening at PORT - ${PORT}`);
// });

export { RateLimitThrottle };
