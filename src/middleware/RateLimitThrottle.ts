import { Request, Response, NextFunction } from 'express';
import { LimiterOptions } from '../types';
import Redis from 'ioredis';

export class RateLimitThrottle {
  rateLimitWindowMs: number;
  maxRequestsPerWindow: number;
  throttleBurst: number;
  throttleRate: number;
  redisClient: Redis;
  customMessage: string | undefined;

  constructor(options: LimiterOptions) {
    this.rateLimitWindowMs = options.rateLimitWindowMs || 15 * 60 * 1000;
    this.maxRequestsPerWindow = options.maxRequestsPerWindow || 100;
    this.throttleBurst = options.throttleBurst || 10;
    this.throttleRate = options.throttleRate || 5;
    this.redisClient = options.redisClient;
    this.customMessage = options.customMessage;
  }
  // Middleware function to handle rate limiting and throttling
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Client's IP Address
      const ip = req.ip;
      if (!ip) return res.status(400).json({ message: 'Failed to get IP' });

      try {
        // Get or initialize request count for Client's IP from Redis
        let requestCount =
          parseInt((await this.redisClient.get(`count:${ip}`)) as string) || 0;

        const currentTime = Date.now();
        if (
          currentTime -
            parseInt(
              (await this.redisClient.get(`startTime:${ip}`)) as string
            ) >
          this.rateLimitWindowMs
        ) {
          // Reset count if the time window has exceeds
          requestCount = 1;
          await this.redisClient.set(`count:${ip}`, requestCount);
          await this.redisClient.set(`startTime:${ip}`, currentTime);
        } else {
          // Incrementing the request count
          requestCount++;
          await this.redisClient.set(
            `count:${ip}`,
            requestCount,
            'PX',
            this.rateLimitWindowMs
          );
          if (requestCount > this.maxRequestsPerWindow) {
            return res.status(429).json({
              message:
                this.customMessage ||
                'Too many requests from this IP, please try again later',
            });
          }
        }
      } catch (error) {
        console.log('Redis error: ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      // Throttling logic
      try {
        let throttleQueue = await this.redisClient.lrange(`queue:${ip}`, 0, -1);
        const now = Date.now();

        // Remove old requests from the queue which is older than 1 second
        while (
          throttleQueue.length > 0 &&
          now - parseInt(throttleQueue[0]) > 1000
        ) {
          await this.redisClient.lpop(`queue:${ip}`);
          throttleQueue.shift();
        }
        // Check's if the number of requests exceeds the burst limit
        if (throttleQueue.length >= this.throttleBurst) {
          return res.status(429).json({
            message:
              this.customMessage ||
              'Too many requests from this IP, please try again later',
          });
        }

        // pushes the current request time to the queue
        await this.redisClient.rpush(`queue:${ip}`, now);

        // Enforce the throttle rate by delaying the response if necessary
        if (throttleQueue.length > this.throttleRate) {
          // Calculating the delay time
          const delay = 1000 - (now - parseInt(throttleQueue[0]));
          setTimeout(() => {
            next();
          }, delay);
        } else {
          next();
        }
      } catch (error) {
        console.log('Redis error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    };
  }
}
