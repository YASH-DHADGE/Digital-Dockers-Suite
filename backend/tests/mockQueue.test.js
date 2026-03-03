/**
 * Mock Queue Tests
 * 
 * Verify mock queue behaves correctly for development use
 */

const MockQueue = require('../utils/mockQueue');

async function runTests() {
    console.log('🧪 Running Mock Queue Tests\n');
    let passed = 0;
    let failed = 0;

    // Test 1: Queue Creation
    try {
        const queue = new MockQueue('test-queue');
        console.assert(queue.name === 'test-queue', 'Queue name should match');
        console.log('✅ Test 1: Queue creation');
        passed++;
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
        failed++;
    }

    // Test 2: Job Addition
    try {
        const queue = new MockQueue('test-queue');
        const job = await queue.add('test-job', { data: 'value' });
        console.assert(job.id === 1, 'First job should have ID 1');
        console.assert(job.data.data === 'value', 'Job data should be preserved');
        console.log('✅ Test 2: Job addition');
        passed++;
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
        failed++;
    }

    // Test 3: Job Processing
    try {
        const queue = new MockQueue('test-queue');
        let processed = false;

        queue.process(async (job) => {
            processed = true;
            return { result: 'success' };
        });

        await queue.add({ test: 'data' });
        console.assert(processed === true, 'Job should be processed');
        console.log('✅ Test 3: Job processing');
        passed++;
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
        failed++;
    }

    // Test 4: Named Processors
    try {
        const queue = new MockQueue('test-queue');
        let namedProcessed = false;

        queue.process('named-job', async (job) => {
            namedProcessed = true;
            return { result: 'named' };
        });

        await queue.add('named-job', { test: 'data' });
        console.assert(namedProcessed === true, 'Named job should be processed');
        console.log('✅ Test 4: Named processors');
        passed++;
    } catch (error) {
        console.error('❌ Test 4 failed:', error.message);
        failed++;
    }

    // Test 5: Error Handling
    try {
        const queue = new MockQueue('test-queue');

        queue.process(async (job) => {
            throw new Error('Intentional error');
        });

        try {
            await queue.add({ test: 'data' });
            console.error('❌ Test 5: Should have thrown error');
            failed++;
        } catch (error) {
            console.assert(error.message === 'Intentional error', 'Error should propagate');
            console.log('✅ Test 5: Error handling');
            passed++;
        }
    } catch (error) {
        console.error('❌ Test 5 failed:', error.message);
        failed++;
    }

    // Test 6: Job Statistics
    try {
        const queue = new MockQueue('test-queue');

        queue.process(async (job) => {
            return { success: true };
        });

        await queue.add({ test: '1' });
        await queue.add({ test: '2' });

        const counts = await queue.getJobCounts();
        console.assert(counts.completed === 2, 'Should have 2 completed jobs');
        console.log('✅ Test 6: Job statistics');
        passed++;
    } catch (error) {
        console.error('❌ Test 6 failed:', error.message);
        failed++;
    }

    // Test 7: Retroactive Processing
    try {
        const queue = new MockQueue('test-queue');

        // Add jobs before processor
        await queue.add('delayed-job', { test: '1' });
        await queue.add('delayed-job', { test: '2' });

        let processCount = 0;

        // Register processor after jobs added
        queue.process('delayed-job', async (job) => {
            processCount++;
            return { success: true };
        });

        // Give it a moment to process
        await new Promise(resolve => setTimeout(resolve, 100));

        console.assert(processCount === 2, 'Should process queued jobs retroactively');
        console.log('✅ Test 7: Retroactive processing');
        passed++;
    } catch (error) {
        console.error('❌ Test 7 failed:', error.message);
        failed++;
    }

    // Summary
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All tests passed!\n');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});
