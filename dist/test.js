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
        this.rateLimitWindowMs = options.rateLimitWindowMs || 15 * 60 * 1000; // 15 minutes
        this.maxRequestsPerWindow = options.maxRequestsPerWindow || 100;
        this.throttleBurst = options.throttleBurst || 10; // initial burst
        this.throttleRate = options.throttleRate || 5; // requests per second
        this.requestCounts = new Map();
        this.throttleQueue = new Map();
        this.redisClient = options.redisClient;
    }
    // Middleware function to handle rate limiting and throttling
    middleware() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const ip = req.ip; // Get the client's IP address
            if (!ip)
                return res.status(400).json({ message: 'Unable to get IP' });
            if (!this.requestCounts.has(ip)) {
                // Initialize request count and start time for new IP
                this.requestCounts.set(ip, { count: 1, startTime: Date.now() });
            }
            else {
                const requestInfo = this.requestCounts.get(ip);
                const currentTime = Date.now();
                // Reset count if the time window has passed
                if (currentTime - requestInfo.startTime > this.rateLimitWindowMs) {
                    requestInfo.count = 1;
                    requestInfo.startTime = currentTime;
                }
                else {
                    // Increment request count and check against limit
                    requestInfo.count++;
                    if (requestInfo.count > this.maxRequestsPerWindow) {
                        // Send a 429 response if the request limit is exceeded
                        return res
                            .status(429)
                            .send('Too many requests from this IP, please try again later');
                    }
                }
                this.requestCounts.set(ip, requestInfo);
            }
            console.log(this.throttleQueue);
            // Throttling logic
            if (!this.throttleQueue.has(ip)) {
                // Initialize throttle queue for new IP
                this.throttleQueue.set(ip, []);
            }
            const now = Date.now();
            const queue = this.throttleQueue.get(ip);
            // Remove old requests from the queue (older than 1 second)
            while (queue.length > 0 && now - queue[0] > 1000) {
                queue.shift();
            }
            // Check if the number of requests exceeds the burst limit
            if (queue.length >= this.throttleBurst) {
                return res
                    .status(429)
                    .send('Too many requests from this IP, please try again later.throttle');
            }
            // Add the current request timestamp to the queue
            queue.push(now);
            // Enforce the throttle rate by delaying the response if necessary
            if (queue.length > this.throttleRate) {
                const delay = 1000 - (now - queue[0]); // Calculate delay time
                setTimeout(() => {
                    next(); // Call the next middleware/function after the delay
                }, delay);
            }
            else {
                next(); // Call the next middleware/function immediately
            }
        });
    }
}
exports.default = RateLimitThrottle;
