import { Redis } from 'ioredis';
export interface LimiterOptions {
  rateLimitWindowMs?: number;
  maxRequestsPerWindow?: number;
  throttleBurst?: number;
  throttleRate?: number;
  redisClient: Redis;
  customMessage?: string;
}
