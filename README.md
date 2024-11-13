<h1 align="center"> <code>rate-throttle-limiter</code> </h1>

An Express middleware for rate limiting and throttling incoming requests based on IP addresses using Redis for storage. It offers both long-term rate limiting and short-term throttling, providing protection against abuse and ensuring fair usage of resources.

## Features

- Implements a hybrid rate limiting approach combining Fixed Window Counter and Leaky Bucket algorithms.
- Limits the number of requests from a single IP address within a specified time window.
- Throttles requests to a specified rate to prevent sudden bursts of traffic.
- Utilizes Redis for efficient storage and distributed rate limiting across multiple instances.

## Installation

```bash
npm install rate-throttle-limiter
```

### Usage:

```typescript
import { RateThrottleLimit } from 'rate-throttle-limiter';
import Redis from 'ioredis';
import express from 'express';
const PORT = 8080;
const app = express();

const redisClient = new Redis(options);

const rateLimitThrottle = new RateLimitThrottle({
  rateLimitWindowMs: 15 * 60 * 1000, // Time window in milliseconds for rate limiting
  maxRequestsPerWindow: 100, // Max requests per window
  throttleBurst: 10, // Initial burst of requests allowed
  throttleRate: 5, // Request's allowed per second after the burst
  redisClient: redisClient,
  customMessage: 'Custom rate limit exceeded message',
});

app.use(rateLimitThrottle.middleware());

app.get('/api/v1/user', (req, res) => {
  res.send('Hi.');
});

app.listen(PORT, () => {
  console.log(`Server listening at PORT - ${PORT}`);
});
```

### Configuration

All function options may be async. Click the name for additional info and
default values.

| Option                 | Type     | Remarks                                                                                                                                              |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rateLimitWindowMs`    | `number` | Specifies the duration within which the maximum number of requests is allowed (Default is 15 minutes).                                               |
| `maxRequestsPerWindow` | `number` | Limits the number of requests that can be made from a single IP address within the specified time window (rateLimitWindowMs) (Default is 100).       |
| `throttleBurst`        | `number` | Allows a certain number of requests to proceed without delay or throttling as soon as the middleware starts processing requests (Default is 10).     |
| `throttleRate`         | `number` | Sets the throttle rate for controlling the rate of incoming requests beyond the initial burst (Default is 5).                                        |
| `redisClient`          | `Redis`  | Provides a connection to a Redis server where rate limiting information is stored, allowing for distributed rate limiting across multiple instances. |
| `customMessage`        | `string` | Optional custom message to be returned when rate limits are exceeded                                                                                 |

## Contributing

Contributions to rate-throttle-limiter are welcome! If you find any issues or want to enhance the library, please create an issue or submit a pull request on the GitHub repository.
