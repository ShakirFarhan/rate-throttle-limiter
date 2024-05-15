"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  RateLimitThrottle: () => RateLimitThrottle
});
module.exports = __toCommonJS(src_exports);

// src/middleware/RateLimitThrottle.ts
var RateLimitThrottle = class {
  rateLimitWindowMs;
  maxRequestsPerWindow;
  throttleBurst;
  throttleRate;
  redisClient;
  customMessage;
  constructor(options) {
    this.rateLimitWindowMs = options.rateLimitWindowMs || 15 * 60 * 1e3;
    this.maxRequestsPerWindow = options.maxRequestsPerWindow || 100;
    this.throttleBurst = options.throttleBurst || 10;
    this.throttleRate = options.throttleRate || 5;
    this.redisClient = options.redisClient;
    this.customMessage = options.customMessage;
  }
  // Middleware function to handle rate limiting and throttling
  middleware() {
    return async (req, res, next) => {
      const ip = req.ip;
      if (!ip)
        return res.status(400).json({ message: "Failed to get IP" });
      try {
        let requestCount = parseInt(await this.redisClient.get(`count:${ip}`)) || 0;
        const currentTime = Date.now();
        if (currentTime - parseInt(
          await this.redisClient.get(`startTime:${ip}`)
        ) > this.rateLimitWindowMs) {
          requestCount = 1;
          await this.redisClient.set(`count:${ip}`, requestCount);
          await this.redisClient.set(`startTime:${ip}`, currentTime);
        } else {
          requestCount++;
          await this.redisClient.set(
            `count:${ip}`,
            requestCount,
            "PX",
            this.rateLimitWindowMs
          );
          if (requestCount > this.maxRequestsPerWindow) {
            return res.status(429).json({
              message: this.customMessage || "Too many requests from this IP, please try again later"
            });
          }
        }
      } catch (error) {
        console.log("Redis error: ", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      try {
        let throttleQueue = await this.redisClient.lrange(`queue:${ip}`, 0, -1);
        const now = Date.now();
        while (throttleQueue.length > 0 && now - parseInt(throttleQueue[0]) > 1e3) {
          await this.redisClient.lpop(`queue:${ip}`);
          throttleQueue.shift();
        }
        if (throttleQueue.length >= this.throttleBurst) {
          return res.status(429).json({
            message: this.customMessage || "Too many requests from this IP, please try again later"
          });
        }
        await this.redisClient.rpush(`queue:${ip}`, now);
        if (throttleQueue.length > this.throttleRate) {
          const delay = 1e3 - (now - parseInt(throttleQueue[0]));
          setTimeout(() => {
            next();
          }, delay);
        } else {
          next();
        }
      } catch (error) {
        console.log("Redis error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RateLimitThrottle
});
