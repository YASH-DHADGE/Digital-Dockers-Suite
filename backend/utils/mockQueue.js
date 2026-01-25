/**
 * Mock Queue Implementation
 * 
 * Purpose: Provides a Bull-compatible queue interface for development environments
 * where Redis is not available. Jobs are processed synchronously in-memory.
 * 
 * Limitations:
 * - No job persistence (lost on restart)
 * - Synchronous processing only (single-threaded)
 * - No retry logic or delayed jobs
 * - No distributed workers support
 * - Ignores job priority
 * 
 * Use Cases:
 * - Local development without Redis
 * - Testing and CI/CD pipelines
 * - Low-volume scenarios
 * 
 * NOT suitable for production use.
 */

class MockQueue {
    constructor(name, options = {}) {
        this.name = name;
        this.options = options;
        this.jobs = [];
        this.handlers = new Map(); // Support multiple named processors
        this.defaultHandler = null;
        this.jobIdCounter = 1;
        this.stats = {
            added: 0,
            processed: 0,
            failed: 0,
            completed: 0
        };

        console.log(`📝 [MockQueue] Created queue: "${name}" (in-memory, synchronous)`);
    }

    /**
     * Add a job to the queue
     * Immediately processes if handler registered, otherwise queues for later
     */
    async add(jobName, data, options = {}) {
        const job = {
            id: this.jobIdCounter++,
            name: typeof jobName === 'string' ? jobName : 'default',
            data: typeof jobName === 'string' ? data : jobName,
            opts: typeof jobName === 'string' ? options : data || {},
            timestamp: new Date(),
            attempts: 0,
            processedOn: null,
            finishedOn: null,
            returnvalue: null,
            failedReason: null
        };

        this.jobs.push(job);
        this.stats.added++;

        console.log(`📌 [MockQueue:${this.name}] Added job #${job.id} "${job.name}"`);

        // Process immediately if handler exists
        await this._processJob(job);

        return job;
    }

    /**
     * Register a job processor
     * Supports both named and default processors
     */
    process(nameOrHandler, concurrencyOrHandler, handler) {
        let processorName = 'default';
        let processorFn;

        // Parse arguments (Bull supports multiple signatures)
        if (typeof nameOrHandler === 'string') {
            processorName = nameOrHandler;
            processorFn = typeof concurrencyOrHandler === 'function'
                ? concurrencyOrHandler
                : handler;
        } else if (typeof nameOrHandler === 'function') {
            processorFn = nameOrHandler;
        } else if (typeof concurrencyOrHandler === 'function') {
            processorFn = concurrencyOrHandler;
        }

        if (!processorFn) {
            throw new Error(`[MockQueue:${this.name}] Invalid processor function`);
        }

        if (processorName === 'default') {
            this.defaultHandler = processorFn;
        } else {
            this.handlers.set(processorName, processorFn);
        }

        console.log(`✅ [MockQueue:${this.name}] Registered processor: "${processorName}"`);

        // Process any pending jobs for this processor
        this._processPendingJobs(processorName);
    }

    /**
     * Process a single job
     */
    async _processJob(job) {
        if (job.processedOn) return; // Already processed

        const handler = this.handlers.get(job.name) || this.defaultHandler;

        if (!handler) {
            console.log(`⚠️  [MockQueue:${this.name}] No handler for job #${job.id} "${job.name}" - queued for later`);
            return;
        }

        job.processedOn = new Date();
        job.attempts++;
        this.stats.processed++;

        try {
            console.log(`🔄 [MockQueue:${this.name}] Processing job #${job.id} "${job.name}"...`);

            const result = await handler(job);

            job.finishedOn = new Date();
            job.returnvalue = result;
            this.stats.completed++;

            console.log(`✅ [MockQueue:${this.name}] Completed job #${job.id} "${job.name}"`);
        } catch (error) {
            job.finishedOn = new Date();
            job.failedReason = error.message;
            this.stats.failed++;

            console.error(`❌ [MockQueue:${this.name}] Failed job #${job.id} "${job.name}":`, error.message);

            // Mock queue doesn't retry - just fail immediately
            throw error;
        }
    }

    /**
     * Process all pending jobs for a specific processor
     */
    async _processPendingJobs(processorName) {
        const pendingJobs = this.jobs.filter(
            job => !job.processedOn && (job.name === processorName || processorName === 'default')
        );

        for (const job of pendingJobs) {
            await this._processJob(job);
        }
    }

    /**
     * Event emitter compatibility (no-op for mock)
     */
    on(event, handler) {
        // Mock queue processes synchronously, so events aren't needed
        // But we keep the interface for compatibility
        return this;
    }

    /**
     * Get queue statistics
     */
    async getJobCounts() {
        return {
            waiting: this.jobs.filter(j => !j.processedOn).length,
            active: 0, // Mock processes synchronously
            completed: this.stats.completed,
            failed: this.stats.failed,
            delayed: 0,
            paused: 0
        };
    }

    /**
     * Get all jobs (for inspection)
     */
    async getJobs(types = ['completed', 'failed', 'waiting']) {
        return this.jobs.filter(job => {
            if (types.includes('waiting') && !job.processedOn) return true;
            if (types.includes('completed') && job.processedOn && !job.failedReason) return true;
            if (types.includes('failed') && job.failedReason) return true;
            return false;
        });
    }

    /**
     * Clean old jobs
     */
    async clean(grace, status) {
        const before = this.jobs.length;
        this.jobs = this.jobs.filter(job => {
            if (status === 'completed' && job.returnvalue) return false;
            if (status === 'failed' && job.failedReason) return false;
            return true;
        });
        const removed = before - this.jobs.length;
        console.log(`🧹 [MockQueue:${this.name}] Cleaned ${removed} jobs`);
        return removed;
    }

    /**
     * Pause queue (no-op for mock)
     */
    async pause() {
        console.log(`⏸️  [MockQueue:${this.name}] Pause requested (no-op in mock)`);
    }

    /**
     * Resume queue (no-op for mock)
     */
    async resume() {
        console.log(`▶️  [MockQueue:${this.name}] Resume requested (no-op in mock)`);
    }

    /**
     * Close queue gracefully
     */
    async close() {
        console.log(`🔒 [MockQueue:${this.name}] Closing queue (${this.jobs.length} jobs in memory)`);
        // Mock queue just clears memory
        this.jobs = [];
        this.handlers.clear();
        this.defaultHandler = null;
    }

    /**
     * Get queue stats for monitoring
     */
    getStats() {
        return {
            name: this.name,
            type: 'mock',
            ...this.stats,
            pending: this.jobs.filter(j => !j.processedOn).length,
            total: this.jobs.length
        };
    }
}

module.exports = MockQueue;
