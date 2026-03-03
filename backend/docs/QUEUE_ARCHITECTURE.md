# Queue Architecture Documentation

## Overview

The Digital Dockers Suite uses a flexible queue system that automatically adapts to the environment:

- **Development**: Uses in-memory mock queues (no Redis required)
- **Production**: Uses Redis-backed Bull queues for reliability and scalability

## Architecture

### Components

1. **MockQueue** (`utils/mockQueue.js`)
   - In-memory queue implementation
   - Bull-compatible API
   - Synchronous job processing
   - No external dependencies

2. **Queue Factory** (`config/queue.config.js`)
   - Automatic environment detection
   - Creates appropriate queue type
   - Handles Redis connection failures
   - Provides initialization and shutdown utilities

3. **Analysis Queue** (`services/queue/analysisQueue.js`)
   - PR analysis job processing
   - Uses factory pattern for queue creation
   - Supports both mock and real queues

## Usage

### Creating a Queue

```javascript
const { createQueue } = require('./config/queue.config');

// Automatically uses Redis or mock based on environment
const myQueue = createQueue('my-queue-name');

// Add jobs
await myQueue.add('job-name', { data: 'value' });

// Process jobs
myQueue.process(async (job) => {
    console.log('Processing:', job.data);
    // Your processing logic
});
```

### Environment Configuration

#### Development (No Redis)

```bash
# .env
NODE_ENV=development
# REDIS_URL not set - uses mock queues
```

#### Development (With Redis)

```bash
# .env
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

#### Production (Requires Redis)

```bash
# .env
NODE_ENV=production
REDIS_URL=rediss://user:pass@redis-host:6379
```

## Mock Queue Limitations

The mock queue is designed for development and has these limitations:

| Feature | Mock Queue | Real Queue (Bull) |
|---------|-----------|-------------------|
| Job Persistence | ❌ Lost on restart | ✅ Persisted in Redis |
| Processing | Synchronous | Asynchronous |
| Retry Logic | ❌ No retries | ✅ Configurable retries |
| Delayed Jobs | ❌ Processed immediately | ✅ Scheduled execution |
| Priority | ❌ Ignored | ✅ Supported |
| Distributed Workers | ❌ Single instance only | ✅ Multiple workers |
| Job Events | ❌ Limited | ✅ Full event system |

## When to Use Each

### Use Mock Queue When:
- Local development
- Running tests
- CI/CD pipelines
- Low-volume scenarios (<10 jobs/min)
- Quick prototyping

### Use Real Queue When:
- Production deployment
- High-volume processing (>10 jobs/min)
- Need job persistence
- Multiple server instances
- Require retry logic
- Jobs take >5 seconds to process

## Migration Path

### Phase 1: Development (Current)
```bash
# No Redis needed
npm install
npm run dev
```

### Phase 2: Local Testing with Redis (Optional)
```bash
# Install Redis locally
brew install redis  # macOS
# or
sudo apt install redis  # Linux

# Start Redis
redis-server

# Update .env
REDIS_URL=redis://localhost:6379

# Restart app
npm run dev
```

### Phase 3: Production Deployment
```bash
# Set up production Redis (Upstash, Redis Cloud, AWS ElastiCache)
# Configure environment
NODE_ENV=production
REDIS_URL=rediss://your-production-redis-url

# Deploy (code unchanged)
npm start
```

## Health Monitoring

### Health Check Endpoint

```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T00:00:00.000Z",
  "services": {
    "mongodb": {
      "status": "healthy",
      "state": "connected",
      "connected": true
    },
    "queue": {
      "status": "healthy",
      "type": "mock",
      "redis": "not-required",
      "mode": "development"
    }
  }
}
```

## Console Output

### Development Mode (Mock Queue)
```
📊 Queue System Initialization
================================
Environment: development
Redis URL: ❌ Not set
Queue Type: 🟡 Mock (In-Memory)

💡 Development Tip:
   Mock queues process jobs synchronously and don't persist.
   To use real queues locally, set REDIS_URL in your .env file.
================================

📝 [MockQueue] Created queue: "pr-analysis" (in-memory, synchronous)
✅ [MockQueue:pr-analysis] Registered processor: "default"
📌 [MockQueue:pr-analysis] Added job #1 "analyze-pr"
🔄 [MockQueue:pr-analysis] Processing job #1 "analyze-pr"...
✅ [MockQueue:pr-analysis] Completed job #1 "analyze-pr"
```

### Production Mode (Real Queue)
```
📊 Queue System Initialization
================================
Environment: production
Redis URL: ✅ Configured
Queue Type: 🔴 Redis (Bull)
================================

🚀 [Queue:pr-analysis] Created Redis-backed queue
✅ [Queue:pr-analysis] Connected to Redis
```

## Troubleshooting

### Issue: "REDIS_URL is required in production"
**Solution**: Set `REDIS_URL` environment variable in production

### Issue: Redis connection fails in development
**Solution**: App automatically falls back to mock queue with warning

### Issue: Jobs not processing
**Solution**: Check that processor is registered before adding jobs

### Issue: Mock queue in production warning
**Solution**: Set up Redis and configure `REDIS_URL`

## Best Practices

1. **Never use mock queues in production**
2. **Always register processors before adding jobs**
3. **Use meaningful queue and job names**
4. **Handle job failures gracefully**
5. **Monitor queue health in production**
6. **Set appropriate job timeouts**
7. **Clean up old jobs periodically**

## Performance Considerations

### Mock Queue Performance
- Single-threaded processing
- No network overhead
- Limited by Node.js event loop
- Suitable for <10 jobs/minute

### Real Queue Performance
- Parallel processing with multiple workers
- Network latency to Redis
- Horizontal scaling possible
- Suitable for thousands of jobs/minute

## Security

### Development
- No authentication needed for mock queues
- Local Redis can run without password

### Production
- Use TLS/SSL (`rediss://` protocol)
- Enable Redis authentication
- Use strong passwords
- Restrict network access to Redis
- Enable Redis persistence (AOF/RDB)

## Further Reading

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Upstash (Serverless Redis)](https://upstash.com/)
