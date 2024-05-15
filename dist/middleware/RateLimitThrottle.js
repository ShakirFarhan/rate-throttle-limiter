"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class RateLimitThrottle {
    constructor(options) {
        this.rateLimitWindowMs = options.rateLimitWindowMs || 15 * 60 * 1000;
        this.maxRequestsPerWindow = options.maxRequestsPerWindow || 100;
        this.throttleBurst = options.throttleBurst || 10;
        this.throttleRate = options.throttleRate || 5;
        this.redisClient = options.redisClient;
        this.customMessage = options.customMessage;
    }
    // Middleware function to handle rate limiting and throttling
    middleware() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            // Client's IP Address
            const ip = req.ip;
            if (!ip)
                return res.status(400).json({ message: 'Failed to get IP' });
            try {
                // Get or initialize request count for Client's IP from Redis
                let requestCount = parseInt((yield this.redisClient.get(`count:${ip}`))) || 0;
                const currentTime = Date.now();
                if (currentTime -
                    parseInt((yield this.redisClient.get(`startTime:${ip}`))) >
                    this.rateLimitWindowMs) {
                    // Reset count if the time window has exceeds
                    requestCount = 1;
                    yield this.redisClient.set(`count:${ip}`, requestCount);
                    yield this.redisClient.set(`startTime:${ip}`, currentTime);
                }
                else {
                    // Incrementing the request count
                    requestCount++;
                    yield this.redisClient.set(`count:${ip}`, requestCount, 'PX', this.rateLimitWindowMs);
                    if (requestCount > this.maxRequestsPerWindow) {
                        return res
                            .status(429)
                            .json({
                            message: this.customMessage ||
                                'Too many requests from this IP, please try again later',
                        });
                    }
                }
            }
            catch (error) {
                console.log('Redis error: ', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
            // Throttling logic
            try {
                let throttleQueue = yield this.redisClient.lrange(`queue:${ip}`, 0, -1);
                const now = Date.now();
                // Remove old requests from the queue which is older than 1 second
                while (throttleQueue.length > 0 &&
                    now - parseInt(throttleQueue[0]) > 1000) {
                    yield this.redisClient.lpop(`queue:${ip}`);
                    throttleQueue.shift();
                }
                // Check's if the number of requests exceeds the burst limit
                if (throttleQueue.length >= this.throttleBurst) {
                    return res
                        .status(429)
                        .json({
                        message: this.customMessage ||
                            'Too many requests from this IP, please try again later',
                    });
                }
                // pushes the current request time to the queue
                yield this.redisClient.rpush(`queue:${ip}`, now);
                // Enforce the throttle rate by delaying the response if necessary
                if (throttleQueue.length > this.throttleRate) {
                    // Calculating the delay time
                    const delay = 1000 - (now - parseInt(throttleQueue[0]));
                    setTimeout(() => {
                        next();
                    }, delay);
                }
                else {
                    next();
                }
            }
            catch (error) {
                console.log('Redis error:', error);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        });
    }
}
exports.default = RateLimitThrottle;
