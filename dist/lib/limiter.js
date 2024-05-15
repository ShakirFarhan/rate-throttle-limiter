"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Balancer {
    constructor(options) {
        this.rateLimits = options.rateLimits || {};
        this.throttleLimits = options.throttleLimits || {};
        this.requests = {};
        this.throttles = {};
        this.resetIntervels();
    }
    resetIntervels() {
        setInterval(() => {
            this.requests = {};
        }, 6000);
    }
    handleRateLimit(method, endpoint) {
        const key = `${method}-${endpoint}`;
        this.requests[key] = this.requests[key] || 0;
        this.requests[key]++;
        return this.requests[key] <= (this.rateLimits[key] || Infinity);
    }
    handleThrottle(method, endpoint) {
        const key = `${method}-${endpoint}`;
        console.log(this.throttles);
        this.throttles[key] = this.throttles[key] || 0;
        this.throttles[key]++;
        console.log(this.throttles[key]);
        return this.throttles[key] <= (this.throttleLimits[key] || Infinity);
    }
    releaseThrottles(method, endpoint) {
        const key = `${method}-${endpoint}`;
        if (this.throttles[key]) {
            this.throttles[key]--;
        }
    }
}
exports.default = Balancer;
