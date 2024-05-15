"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const limiter_1 = __importDefault(require("./limiter"));
class Middleware {
    constructor(options) {
        this.rateLimiter = (req, res, next) => {
            const method = req.method;
            const endpoint = req.baseUrl + req.path;
            if (this.balancer.handleRateLimit(method, endpoint)) {
                next();
            }
            else {
                res.status(429).json({ message: 'Rate Limit Exceeded ' });
            }
        };
        this.throttler = (req, res, next) => {
            const method = req.method;
            const endpoint = req.baseUrl + req.path;
            if (this.balancer.handleThrottle(method, endpoint)) {
                res.on('finish', () => {
                    this.balancer.releaseThrottles(method, endpoint);
                });
                next();
            }
            else {
                res.status(429).send('Throttle Limit Exceeded');
            }
        };
        this.balancer = new limiter_1.default(options);
    }
}
exports.default = Middleware;
