"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitThrottle = void 0;
// import express from 'express';
// import { Request, Response } from 'express';
const RateLimitThrottle_1 = __importDefault(require("./middleware/RateLimitThrottle"));
exports.RateLimitThrottle = RateLimitThrottle_1.default;
