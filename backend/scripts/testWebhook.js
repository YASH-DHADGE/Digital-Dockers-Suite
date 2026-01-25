const axios = require('axios');

const payload = {
    action: 'opened',
    number: 123,
    pull_request: {
        number: 123,
        title: 'Test PR: Refactor User Auth',
        state: 'open',
        user: {
            login: 'testuser'
        },
        head: {
            ref: 'feature/auth-refactor'
        }
    },
    repository: {
        full_name: 'testuser/digital-dockers-suite'
    },
    sender: {
        login: 'testuser'
    }
};

// Note: Signature verification will fail unless GITHUB_WEBHOOK_SECRET is set mathematically matches this payload.
// But our controller logs a warning and proceeds if secret is missing in dev mode.

async function testWebhook() {
    try {
        console.log('Sending mock webhook payload...');
        const res = await axios.post('http://localhost:5000/api/webhooks/github', payload, {
            headers: {
                'x-github-event': 'pull_request'
            }
        });
        console.log(`Response Status: ${res.status}`);
        console.log(`Response Data: ${res.data}`);
    } catch (err) {
        console.error('Error sending webhook:', err.message);
        if (err.response) {
            console.error('Server responded with:', err.response.data);
        }
    }
}

testWebhook();
